# -*- coding: utf-8 -*-
"""
Lançador do Sistema RTC (simulador de CBS e IBS).

Liga as três peças em segundo plano (calculadora da Receita, back-end do SaaS e a tela),
abre o navegador e desliga tudo ao fechar a janela. É empacotado em .exe com PyInstaller
(veja build-exe.ps1).

    Sistema RTC.exe            abre a janela e liga tudo
    Sistema RTC.exe --teste    autoteste sem janela; resultado em logs\\autoteste.txt
"""
from __future__ import annotations

import ctypes
import json
import os
import queue
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from ctypes import wintypes
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

NOME = "Sistema RTC"
JAVA_MINIMO = 25  # a calculadora da Receita exige Java 25
CREATE_NO_WINDOW = 0x08000000
PORTA_INSTANCIA_UNICA = 47653  # impede abrir o lançador duas vezes


# --------------------------------------------------------------------------- configuração


def pasta_do_programa() -> Path:
    """Pasta do .exe (ou do projeto, quando rodado como script)."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


@dataclass
class Config:
    raiz: Path
    calculadora: Path
    porta_calc: int = 8080
    porta_back: int = 8081
    porta_front: int = 3100  # 3000 costuma ser a do CRM

    @property
    def backend(self) -> Path:
        return self.raiz / "backend"

    @property
    def frontend(self) -> Path:
        return self.raiz / "frontend"

    @property
    def logs(self) -> Path:
        return self.raiz / "logs"

    @property
    def url(self) -> str:
        return f"http://localhost:{self.porta_front}"


def carregar_config() -> Config:
    """Padrões + `launcher.json` opcional ao lado do .exe (raiz, calculadora, portas)."""
    raiz = pasta_do_programa()
    extra: dict = {}
    arquivo = raiz / "launcher.json"
    if arquivo.exists():
        try:
            extra = json.loads(arquivo.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            extra = {}  # arquivo ilegível: segue com os padrões
    if "raiz" in extra:
        raiz = Path(extra["raiz"])
    return Config(
        raiz=raiz,
        calculadora=Path(extra.get("calculadora", raiz.parent / "calculadora-rtc-regime-regular")),
        porta_calc=int(extra.get("porta_calc", 8080)),
        porta_back=int(extra.get("porta_back", 8081)),
        porta_front=int(extra.get("porta_front", 3100)),
    )


# --------------------------------------------------------------------------- ambiente


def versao_java(exe: Path) -> int | None:
    try:
        r = subprocess.run([str(exe), "-version"], capture_output=True, text=True, timeout=20,
                           creationflags=CREATE_NO_WINDOW)
    except (OSError, subprocess.SubprocessError):
        return None
    m = re.search(r'version "(\d+)', (r.stderr or "") + (r.stdout or ""))
    return int(m.group(1)) if m else None


def achar_java() -> Path | None:
    """Primeiro Java com versão suficiente: JAVA_HOME, PATH, depois pastas comuns de instalação."""
    candidatos: list[Path] = []
    if os.environ.get("JAVA_HOME"):
        candidatos.append(Path(os.environ["JAVA_HOME"]) / "bin" / "java.exe")
    achado = shutil.which("java")
    if achado:
        candidatos.append(Path(achado))
    for base in (Path(r"C:\Program Files\Eclipse Adoptium"), Path(r"C:\Program Files\Java"),
                 Path(r"C:\Program Files\Microsoft")):
        if base.is_dir():
            candidatos += sorted(base.glob("jdk-*/bin/java.exe"), reverse=True)
    vistos: set[Path] = set()
    for c in candidatos:
        if c in vistos or not c.exists():
            continue
        vistos.add(c)
        v = versao_java(c)
        if v is not None and v >= JAVA_MINIMO:
            return c
    return None


def achar_jar(pasta: Path) -> Path | None:
    jars = [j for j in (pasta / "target").glob("*.jar")
            if not j.name.endswith(("-sources.jar", "-javadoc.jar"))]
    return max(jars, key=lambda j: j.stat().st_size) if jars else None


def front_pronto(cfg: Config) -> bool:
    return (cfg.frontend / ".next" / "BUILD_ID").exists() and (cfg.frontend / "node_modules" / "next").is_dir()


def banco_pronto(cfg: Config) -> bool:
    return (cfg.calculadora / "calculadora" / "db" / "calculadora-pro.db").exists()


def faltando(cfg: Config) -> bool:
    """True se algo precisa ser montado antes de ligar (primeira vez ou depois de apagar pastas)."""
    return not (achar_jar(cfg.calculadora) and achar_jar(cfg.backend) and front_pronto(cfg) and banco_pronto(cfg))


def verificar(cfg: Config) -> tuple[list[str], Path | None, str | None]:
    """Confere os pré-requisitos. Devolve (problemas em português simples, java, npm)."""
    problemas: list[str] = []
    if not cfg.calculadora.is_dir():
        problemas.append(
            f"Não achei a calculadora da Receita em:\n  {cfg.calculadora}\n"
            "Baixe com:  git clone https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git\n"
            "(na pasta ao lado do projeto), ou indique o caminho em launcher.json.")
    for nome, pasta in (("back-end", cfg.backend), ("tela", cfg.frontend)):
        if not pasta.is_dir():
            problemas.append(f"Não achei a pasta do {nome}:\n  {pasta}\nO .exe deve ficar na pasta do projeto.")
    java = achar_java()
    if java is None:
        problemas.append(f"Java {JAVA_MINIMO} ou superior não encontrado.\n"
                         "Instale com:  winget install EclipseAdoptium.Temurin.25.JDK")
    node = shutil.which("node")
    npm = shutil.which("npm")
    if node is None or npm is None:
        problemas.append("Node.js não encontrado.\nInstale com:  winget install OpenJS.NodeJS.LTS")
    return problemas, java, npm


def porta_ocupada(porta: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", porta), timeout=0.5):
            return True
    except OSError:
        return False


def responde(url: str, tempo: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=tempo) as r:
            return 200 <= r.status < 400
    except (urllib.error.URLError, OSError, ValueError):
        return False


# --------------------------------------------------------------------------- Windows: Job Object


class _IoCounters(ctypes.Structure):
    _fields_ = [(n, ctypes.c_ulonglong) for n in (
        "ReadOperationCount", "WriteOperationCount", "OtherOperationCount",
        "ReadTransferCount", "WriteTransferCount", "OtherTransferCount")]


class _BasicLimits(ctypes.Structure):
    _fields_ = [("PerProcessUserTimeLimit", ctypes.c_int64), ("PerJobUserTimeLimit", ctypes.c_int64),
                ("LimitFlags", wintypes.DWORD), ("MinimumWorkingSetSize", ctypes.c_size_t),
                ("MaximumWorkingSetSize", ctypes.c_size_t), ("ActiveProcessLimit", wintypes.DWORD),
                ("Affinity", ctypes.c_size_t), ("PriorityClass", wintypes.DWORD),
                ("SchedulingClass", wintypes.DWORD)]


class _ExtendedLimits(ctypes.Structure):
    _fields_ = [("BasicLimitInformation", _BasicLimits), ("IoInfo", _IoCounters),
                ("ProcessMemoryLimit", ctypes.c_size_t), ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryUsed", ctypes.c_size_t), ("PeakJobMemoryUsed", ctypes.c_size_t)]


class JobObject:
    """
    "Cercado" do Windows: tudo que entra nele morre quando o lançador fecha, até se ele travar.
    Sem isso, um Java esquecido continuaria ocupando a porta e a memória.
    """

    _KILL_ON_JOB_CLOSE = 0x2000
    _EXTENDED_LIMIT_INFORMATION = 9

    def __init__(self) -> None:
        self._k = ctypes.WinDLL("kernel32", use_last_error=True)
        self._k.CreateJobObjectW.restype = wintypes.HANDLE
        self._k.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
        self._k.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
        self._k.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
        self._k.TerminateJobObject.argtypes = [wintypes.HANDLE, wintypes.UINT]
        self._k.CloseHandle.argtypes = [wintypes.HANDLE]
        self._h = self._k.CreateJobObjectW(None, None)
        self.ativo = bool(self._h)
        if self.ativo:
            info = _ExtendedLimits()
            info.BasicLimitInformation.LimitFlags = self._KILL_ON_JOB_CLOSE
            self.ativo = bool(self._k.SetInformationJobObject(
                self._h, self._EXTENDED_LIMIT_INFORMATION, ctypes.byref(info), ctypes.sizeof(info)))

    def adicionar(self, proc: subprocess.Popen) -> bool:
        if not self.ativo:
            return False
        return bool(self._k.AssignProcessToJobObject(self._h, wintypes.HANDLE(int(proc._handle))))  # noqa: SLF001

    def encerrar(self) -> None:
        if self._h:
            self._k.TerminateJobObject(self._h, 1)
            self._k.CloseHandle(self._h)
            self._h = None
            self.ativo = False


# --------------------------------------------------------------------------- as três peças


@dataclass
class Servico:
    nome: str
    porta: int
    saude: str  # URL que responde 200 quando está no ar
    comando: list[str]
    pasta: Path
    log: Path
    espera: int  # segundos até desistir de esperar
    env: dict[str, str] = field(default_factory=dict)
    estado: str = "parado"  # parado | iniciando | no ar | erro | externo
    detalhe: str = ""
    proc: subprocess.Popen | None = None
    arquivo_log: object | None = None


class Sistema:
    """Liga e desliga calculadora → back-end → tela, nesta ordem (e desliga na ordem inversa)."""

    def __init__(self, cfg: Config, java: Path, avisar: Callable[[str], None], mudou: Callable[[], None]) -> None:
        self.cfg = cfg
        self.java = java
        self.avisar = avisar
        self.mudou = mudou
        self.servicos: list[Servico] = []
        self.job: JobObject | None = None
        self._cancelar = threading.Event()

    def _montar(self) -> list[Servico]:
        c, java = self.cfg, str(self.java)
        jar_calc, jar_back = achar_jar(c.calculadora), achar_jar(c.backend)
        assert jar_calc and jar_back, "jars não encontrados (rode a preparação)"
        proxima = c.frontend / "node_modules" / "next" / "dist" / "bin" / "next"
        calc_api = f"http://localhost:{c.porta_calc}/api/calculadora"
        return [
            Servico("Calculadora da Receita", c.porta_calc,
                    f"{calc_api}/dados-abertos/versao",
                    [java, "-Dspring.profiles.active=offline", "-jar", str(jar_calc), f"--server.port={c.porta_calc}"],
                    c.calculadora, c.logs / "calculadora.log", 150),
            Servico("Back-end do SaaS", c.porta_back,
                    f"http://localhost:{c.porta_back}/actuator/health",
                    [java, "-jar", str(jar_back), f"--server.port={c.porta_back}", f"--rtc.api.base-url={calc_api}"],
                    c.backend, c.logs / "backend.log", 120),
            Servico("Tela (site)", c.porta_front, c.url,
                    [shutil.which("node") or "node", str(proxima), "start", "--port", str(c.porta_front)],
                    c.frontend, c.logs / "tela.log", 90,
                    env={"BACKEND_URL": f"http://localhost:{c.porta_back}"}),
        ]

    def ligar(self) -> bool:
        self.cfg.logs.mkdir(parents=True, exist_ok=True)
        self._cancelar.clear()
        self.job = JobObject()
        self.servicos = self._montar()
        self.mudou()
        for s in self.servicos:
            if self._cancelar.is_set() or not self._ligar_um(s):
                return False
        return True

    def _ligar_um(self, s: Servico) -> bool:
        self.avisar(f"Ligando: {s.nome}…")
        if porta_ocupada(s.porta):
            if responde(s.saude):
                s.estado, s.detalhe = "externo", "já estava ligado"
                self.mudou()
                return True
            s.estado, s.detalhe = "erro", f"A porta {s.porta} está ocupada por outro programa."
            self.mudou()
            return False

        s.estado = "iniciando"
        self.mudou()
        s.arquivo_log = open(s.log, "wb")
        try:
            s.proc = subprocess.Popen(
                s.comando, cwd=s.pasta, env={**os.environ, **s.env}, stdin=subprocess.DEVNULL,
                stdout=s.arquivo_log, stderr=subprocess.STDOUT, creationflags=CREATE_NO_WINDOW)
        except OSError as e:
            s.estado, s.detalhe = "erro", f"Não consegui iniciar: {e}"
            self.mudou()
            return False
        if self.job:
            self.job.adicionar(s.proc)

        limite = time.time() + s.espera
        while time.time() < limite:
            if self._cancelar.is_set():
                return False
            codigo = s.proc.poll()
            if codigo is not None:
                s.estado, s.detalhe = "erro", f"Encerrou sozinho (código {codigo}). Veja o log."
                self.mudou()
                return False
            if responde(s.saude):
                s.estado, s.detalhe = "no ar", f"porta {s.porta}"
                self.mudou()
                return True
            time.sleep(1)
        s.estado, s.detalhe = "erro", f"Não respondeu em {s.espera} segundos. Veja o log."
        self.mudou()
        return False

    def vigiar(self) -> None:
        """Roda numa thread: avisa se alguma peça cair depois de ligada."""
        while not self._cancelar.is_set():
            time.sleep(3)
            for s in self.servicos:
                if s.estado == "no ar" and s.proc is not None and s.proc.poll() is not None:
                    s.estado, s.detalhe = "erro", "Parou inesperadamente. Veja o log."
                    self.avisar(f"{s.nome} parou. Veja os logs.")
                    self.mudou()

    def desligar(self) -> None:
        self._cancelar.set()
        for s in reversed(self.servicos):
            if s.proc is not None and s.proc.poll() is None:
                subprocess.run(["taskkill", "/PID", str(s.proc.pid), "/T", "/F"],
                               capture_output=True, creationflags=CREATE_NO_WINDOW)
        if self.job:
            self.job.encerrar()
        for s in self.servicos:
            if s.proc is not None:
                try:
                    s.proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    pass
            if s.arquivo_log is not None:
                s.arquivo_log.close()  # type: ignore[attr-defined]
                s.arquivo_log = None
            if s.estado != "externo":
                s.estado, s.detalhe = "parado", ""
        self.mudou()


# --------------------------------------------------------------------------- preparação (primeira vez)


def preparar(cfg: Config, java: Path, npm: str, saida: Callable[[str], None], forcar: bool = False) -> bool:
    """Gera o que falta: banco da calculadora, os dois .jar e a versão de produção da tela."""
    env = {**os.environ, "JAVA_HOME": str(java.parent.parent)}
    passos: list[tuple[str, list[str], Path]] = []
    if not banco_pronto(cfg):
        (cfg.calculadora / "calculadora" / "db").mkdir(parents=True, exist_ok=True)
        passos.append(("o banco de dados da calculadora",
                       [str(cfg.calculadora / "mvnw.cmd"), "flyway:migrate",
                        "-Dflyway.configFiles=flyway\\flyway-pro.conf", "--batch-mode"], cfg.calculadora))
    if forcar or not achar_jar(cfg.calculadora):
        passos.append(("a calculadora da Receita",
                       [str(cfg.calculadora / "mvnw.cmd"), "clean", "package", "-DskipTests", "--batch-mode"],
                       cfg.calculadora))
    if forcar or not achar_jar(cfg.backend):
        passos.append(("o back-end do SaaS",
                       [str(cfg.backend / "mvnw.cmd"), "clean", "package", "-DskipTests", "--batch-mode"], cfg.backend))
    if not (cfg.frontend / "node_modules" / "next").is_dir():
        passos.append(("as bibliotecas da tela", [npm, "install"], cfg.frontend))
    if forcar or not front_pronto(cfg):
        passos.append(("a tela", [npm, "run", "build"], cfg.frontend))

    for nome, comando, pasta in passos:
        saida(f"== Preparando {nome}… (pode levar alguns minutos)")
        try:
            p = subprocess.Popen(comando, cwd=pasta, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                 stdin=subprocess.DEVNULL, text=True, encoding="utf-8", errors="replace",
                                 creationflags=CREATE_NO_WINDOW)
        except OSError as e:
            saida(f"ERRO ao iniciar: {e}")
            return False
        assert p.stdout is not None
        for linha in p.stdout:
            saida(linha.rstrip())
        if p.wait() != 0:
            saida(f"ERRO: não consegui preparar {nome} (código {p.returncode}).")
            return False
    return True


# --------------------------------------------------------------------------- autoteste (sem janela)


def autoteste() -> int:
    """Liga tudo, faz uma simulação de ponta a ponta pela tela, desliga. Resultado em logs\\autoteste.txt."""
    cfg = carregar_config()
    cfg.logs.mkdir(parents=True, exist_ok=True)
    arq = open(cfg.logs / "autoteste.txt", "w", encoding="utf-8")

    def dizer(texto: str) -> None:
        arq.write(texto + "\n")
        arq.flush()
        if sys.stdout:
            print(texto)

    problemas, java, npm = verificar(cfg)
    if problemas or java is None or npm is None:
        dizer("FALHOU: " + " | ".join(problemas))
        return 1
    dizer(f"Java: {java}")
    if not preparar(cfg, java, npm, lambda t: dizer("  " + t)):
        dizer("FALHOU na preparação")
        return 1

    sistema = Sistema(cfg, java, avisar=dizer, mudou=lambda: None)
    inicio = time.time()
    try:
        if not sistema.ligar():
            for s in sistema.servicos:
                dizer(f"  {s.nome}: {s.estado} {s.detalhe}")
            dizer("FALHOU ao ligar")
            return 1
        dizer(f"Tudo no ar em {time.time() - inicio:.0f}s")

        corpo = json.dumps({
            "uf": "RS", "municipio": 4314902, "dataFatoGerador": "2027-03-10",
            "itens": [{"tipo": "SERVICO", "codigo": "122011200", "cst": "200", "cClassTrib": "200028",
                       "baseCalculo": 1200, "aliquotas": {"cbs": 8.8, "ibsEstadual": 0.05, "ibsMunicipal": 0.05}}],
        }).encode()
        req = urllib.request.Request(f"{cfg.url}/backend/simulacoes", data=corpo,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            total = json.loads(r.read())["totais"]["total"]
        if abs(total - 42.72) > 0.005:
            dizer(f"FALHOU: total esperado 42,72 e veio {total}")
            return 1
        dizer(f"OK: simulação de ponta a ponta pela tela deu total {total}")
        return 0
    except (OSError, ValueError, KeyError) as e:
        dizer(f"FALHOU: {e}")
        return 1
    finally:
        sistema.desligar()
        dizer("Tudo desligado." if not any(porta_ocupada(p) for p in (cfg.porta_calc, cfg.porta_back, cfg.porta_front))
              else "ATENÇÃO: alguma porta continua ocupada depois de desligar.")
        arq.close()


# --------------------------------------------------------------------------- janela


COR = {"parado": "#9ca3af", "iniciando": "#f59e0b", "no ar": "#16a34a", "erro": "#dc2626", "externo": "#2563eb"}
TEXTO_ESTADO = {"parado": "Desligado", "iniciando": "Ligando…", "no ar": "No ar", "erro": "Problema", "externo": "No ar (já estava ligado)"}
VERDE, FUNDO, TEXTO, CINZA = "#047857", "#ffffff", "#111827", "#6b7280"


class Janela:
    def __init__(self, cfg: Config) -> None:
        import tkinter as tk
        from tkinter import messagebox

        self.tk, self.messagebox = tk, messagebox
        self.cfg = cfg
        self.fila: queue.Queue = queue.Queue()
        self.sistema: Sistema | None = None
        self.ocupado = False
        self.fechando = False

        self.raiz = tk.Tk()
        self.raiz.title(NOME)
        self.raiz.configure(bg=FUNDO)
        self.raiz.resizable(False, False)
        icone = Path(getattr(sys, "_MEIPASS", Path(__file__).parent)) / "icone.ico"
        try:
            self.raiz.iconbitmap(str(icone))
        except tk.TclError:
            pass  # sem ícone: segue com o padrão

        # Tamanhos de fonte NEGATIVOS = pixels (o monitor roda a 125%; em pontos o layout estoura).
        f = lambda tamanho, estilo="": ("Segoe UI", -tamanho, estilo)  # noqa: E731
        corpo = tk.Frame(self.raiz, bg=FUNDO, padx=22, pady=18)
        corpo.pack()
        tk.Frame(corpo, width=520, height=1, bg=FUNDO).pack()  # largura fixa: a janela não "pula" com o texto
        tk.Label(corpo, text="Sistema RTC", font=f(24, "bold"), bg=FUNDO, fg=TEXTO).pack(anchor="w")
        tk.Label(corpo, text="Simulador de CBS e IBS", font=f(14), bg=FUNDO, fg=CINZA).pack(anchor="w", pady=(0, 14))

        self.linhas: list[tuple] = []
        for nome in ("Calculadora da Receita", "Back-end do SaaS", "Tela (site)"):
            linha = tk.Frame(corpo, bg=FUNDO)
            linha.pack(fill="x", pady=3)
            ponto = tk.Canvas(linha, width=16, height=16, bg=FUNDO, highlightthickness=0)
            bolinha = ponto.create_oval(2, 2, 14, 14, fill=COR["parado"], outline="")
            ponto.pack(side="left", padx=(0, 10))
            tk.Label(linha, text=nome, font=f(15, "bold"), bg=FUNDO, fg=TEXTO, width=21, anchor="w").pack(side="left")
            estado = tk.Label(linha, text=TEXTO_ESTADO["parado"], font=f(13), bg=FUNDO, fg=CINZA, anchor="w",
                              justify="left", wraplength=250)
            estado.pack(side="left", fill="x")
            self.linhas.append((ponto, bolinha, estado))

        self.mensagem = tk.Label(corpo, text="", font=f(14), bg=FUNDO, fg=TEXTO, justify="left", anchor="w",
                                 wraplength=470)
        self.mensagem.pack(fill="x", pady=(16, 10))

        botoes = tk.Frame(corpo, bg=FUNDO)
        botoes.pack(fill="x")
        self.b_abrir = tk.Button(botoes, text="Abrir no navegador", font=f(14, "bold"), bg=VERDE, fg="white",
                                 activebackground="#065f46", activeforeground="white", relief="flat", padx=14, pady=7,
                                 state="disabled", command=lambda: webbrowser.open(cfg.url))
        self.b_abrir.pack(side="left")
        tk.Button(botoes, text="Ver logs", font=f(14), relief="groove", padx=12, pady=7,
                  command=self.abrir_logs).pack(side="left", padx=8)
        tk.Button(botoes, text="Parar e sair", font=f(14), relief="groove", padx=12, pady=7,
                  command=self.fechar).pack(side="right")

        self.saida = tk.Text(corpo, height=11, width=70, font=("Consolas", -12), bg="#f3f4f6", fg=TEXTO,
                             relief="flat", state="disabled", wrap="none")  # aparece só durante a preparação

        menu = tk.Menu(self.raiz)
        avancado = tk.Menu(menu, tearoff=0)
        avancado.add_command(label="Religar tudo", command=lambda: self.iniciar(reconstruir=False))
        avancado.add_command(label="Reconstruir tudo (depois de atualizar o código)",
                             command=lambda: self.iniciar(reconstruir=True))
        avancado.add_separator()
        avancado.add_command(label="Abrir pasta de logs", command=self.abrir_logs)
        menu.add_cascade(label="Avançado", menu=avancado)
        self.raiz.config(menu=menu)

        self.raiz.protocol("WM_DELETE_WINDOW", self.fechar)
        self.raiz.update_idletasks()
        x = (self.raiz.winfo_screenwidth() - self.raiz.winfo_width()) // 2
        y = (self.raiz.winfo_screenheight() - self.raiz.winfo_height()) // 3
        self.raiz.geometry(f"+{max(x, 0)}+{max(y, 0)}")

    # ---- comunicação com a thread de trabalho: só a fila toca na tela
    def _poll(self) -> None:
        try:
            while True:
                tipo, *dados = self.fila.get_nowait()
                if tipo == "msg":
                    self.mensagem.config(text=dados[0])
                elif tipo == "estado":
                    self._pintar()
                elif tipo == "saida":
                    self._linha_de_saida(dados[0])
                elif tipo == "mostrar_saida":
                    self.saida.pack(fill="x", pady=(12, 0)) if dados[0] else self.saida.pack_forget()
                elif tipo == "abrir":
                    self.b_abrir.config(state="normal" if dados[0] else "disabled")
                elif tipo == "fatal":
                    self.mensagem.config(text="Não foi possível iniciar.")
                    self.messagebox.showerror(NOME, dados[0])
                elif tipo == "sair":
                    self.raiz.destroy()
                    return
        except queue.Empty:
            pass
        self.raiz.after(150, self._poll)

    def _pintar(self) -> None:
        servicos = self.sistema.servicos if self.sistema else []
        for i, (ponto, bolinha, rotulo) in enumerate(self.linhas):
            s = servicos[i] if i < len(servicos) else None
            estado = s.estado if s else "parado"
            ponto.itemconfig(bolinha, fill=COR[estado])
            texto = TEXTO_ESTADO[estado]
            if s and s.detalhe and estado in ("erro", "no ar"):
                texto = s.detalhe if estado == "erro" else f"No ar ({s.detalhe})"
            rotulo.config(text=texto, fg="#b91c1c" if estado == "erro" else CINZA)

    def _linha_de_saida(self, linha: str) -> None:
        self.saida.config(state="normal")
        self.saida.insert("end", linha + "\n")
        self.saida.see("end")
        self.saida.config(state="disabled")

    # ---- ações
    def iniciar(self, reconstruir: bool = False) -> None:
        if self.ocupado or self.fechando:
            return
        self.ocupado = True
        threading.Thread(target=self._fluxo, args=(reconstruir,), daemon=True).start()

    def _fluxo(self, reconstruir: bool) -> None:
        put = self.fila.put
        try:
            if self.sistema:  # religar / reconstruir: desliga o que estiver ligado
                put(("abrir", False))
                put(("msg", "Desligando antes de religar…"))
                self.sistema.desligar()
            problemas, java, npm = verificar(self.cfg)
            if problemas or java is None or npm is None:
                put(("fatal", "\n\n".join(problemas)))
                return
            if reconstruir or faltando(self.cfg):
                put(("msg", "Preparando o sistema" + ("" if reconstruir else " pela primeira vez")
                     + ". Isso leva alguns minutos e só acontece agora."))
                put(("mostrar_saida", True))
                if not preparar(self.cfg, java, npm, lambda t: put(("saida", t)), forcar=reconstruir):
                    put(("msg", "A preparação falhou. Leia as últimas linhas abaixo."))
                    return
                put(("mostrar_saida", False))

            self.sistema = Sistema(self.cfg, java, avisar=lambda t: put(("msg", t)), mudou=lambda: put(("estado",)))
            if self.sistema.ligar():
                put(("msg", "Tudo no ar! O navegador foi aberto. Para desligar, clique em “Parar e sair”."))
                put(("abrir", True))
                if not os.environ.get("RTC_SEM_NAVEGADOR"):  # variável usada nos testes automáticos
                    webbrowser.open(self.cfg.url)
                self.sistema.vigiar()  # fica aqui vigiando até desligar
            else:
                put(("msg", "Não deu para ligar tudo. Veja o problema na linha em vermelho e use “Ver logs”."))
        finally:
            self.ocupado = False

    def abrir_logs(self) -> None:
        self.cfg.logs.mkdir(parents=True, exist_ok=True)
        os.startfile(self.cfg.logs)  # type: ignore[attr-defined]

    def fechar(self) -> None:
        if self.fechando:
            return
        ligado = self.sistema is not None and any(s.estado in ("no ar", "iniciando") for s in self.sistema.servicos)
        if ligado and not self.messagebox.askyesno(NOME, "Parar o sistema e fechar?"):
            return
        self.fechando = True
        self.mensagem.config(text="Desligando…")
        self.b_abrir.config(state="disabled")

        def parar() -> None:
            if self.sistema:
                self.sistema.desligar()
            self.fila.put(("sair",))

        threading.Thread(target=parar, daemon=True).start()

    def rodar(self) -> None:
        self.raiz.after(150, self._poll)
        self.raiz.after(300, self.iniciar)
        self.raiz.mainloop()


def instancia_unica() -> socket.socket | None:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", PORTA_INSTANCIA_UNICA))
        return s
    except OSError:
        return None


def main() -> None:
    if "--teste" in sys.argv:
        sys.exit(autoteste())
    trava = instancia_unica()
    if trava is None:
        import tkinter
        from tkinter import messagebox

        tkinter.Tk().withdraw()
        messagebox.showinfo(NOME, "O Sistema RTC já está aberto. Procure a janela na barra de tarefas.")
        return
    Janela(carregar_config()).rodar()


if __name__ == "__main__":
    main()

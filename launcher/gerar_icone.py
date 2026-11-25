# -*- coding: utf-8 -*-
"""Gera icone.ico (quadrado verde com um "R") para o .exe e para a janela do lançador."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

TAMANHO = 256
imagem = Image.new("RGBA", (TAMANHO, TAMANHO), (0, 0, 0, 0))
desenho = ImageDraw.Draw(imagem)
desenho.rounded_rectangle((8, 8, TAMANHO - 8, TAMANHO - 8), radius=56, fill=(4, 120, 87, 255))
try:
    fonte = ImageFont.truetype("segoeuib.ttf", 160)
except OSError:
    fonte = ImageFont.load_default()
desenho.text((TAMANHO // 2, TAMANHO // 2 + 6), "R", font=fonte, fill="white", anchor="mm")

destino = Path(__file__).parent / "icone.ico"
imagem.save(destino, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print(f"Ícone gerado: {destino}")

package br.com.saascalculadora.backend.rtc;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(RtcProperties.class)
public class RtcConfig {

    @Bean
    RestClient rtcRestClient(RtcProperties props) {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(20));
        return RestClient.builder().baseUrl(props.baseUrl()).requestFactory(factory).build();
    }
}

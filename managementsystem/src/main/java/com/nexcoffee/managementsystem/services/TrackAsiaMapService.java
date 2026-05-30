package com.nexcoffee.managementsystem.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
@RequiredArgsConstructor
public class TrackAsiaMapService {

    @Value("${trackasia.api-key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public String autocomplete(String input) {
        URI uri = UriComponentsBuilder
                .fromUriString("https://maps.track-asia.com/api/v2/place/autocomplete/json")
                .queryParam("input", input)
                .queryParam("size", 5)
                .queryParam("new_admin", true)
                .queryParam("include_old_admin", true)
                .queryParam("key", apiKey)
                .build()
                .encode()
                .toUri();

        return restTemplate.getForObject(uri, String.class);
    }

    public String placeDetail(String placeId) {
        URI uri = UriComponentsBuilder
                .fromUriString("https://maps.track-asia.com/api/v2/place/details/json")
                .queryParam("place_id", placeId)
                .queryParam("new_admin", true)
                .queryParam("include_old_admin", true)
                .queryParam("key", apiKey)
                .build()
                .encode()
                .toUri();

        return restTemplate.getForObject(uri, String.class);
    }

    public JsonNode distanceMatrix(
            double shopLatitude,
            double shopLongitude,
            double customerLatitude,
            double customerLongitude
    ) {
        String coordinates = shopLongitude + "," + shopLatitude
                + ";"
                + customerLongitude + "," + customerLatitude;

        URI uri = UriComponentsBuilder
                .fromUriString("https://maps.track-asia.com/distance-matrix/v1/moto/" + coordinates)
                .queryParam("sources", 0)
                .queryParam("destinations", 1)
                .queryParam("annotations", "distance,duration")
                .queryParam("key", apiKey)
                .build()
                .encode()
                .toUri();

        String body = restTemplate.getForObject(uri, String.class);

        try {
            return objectMapper.readTree(body);
        } catch (Exception exception) {
            throw new RuntimeException("Không thể tính khoảng cách giao hàng.");
        }
    }
}
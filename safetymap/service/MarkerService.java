package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.MarkerPublicDto;
import com.safetymap.safetymap.entity.Marker;
import com.safetymap.safetymap.repository.MarkerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MarkerService {

    private final MarkerRepository markerRepository;

    public MarkerService(MarkerRepository markerRepository) {
        this.markerRepository = markerRepository;
    }

    // 지도 범위 안의 마커 목록 가져오기 (marker_type 이 있으면 종류로 거른다)
    public List<MarkerPublicDto> getMarkersInBounds(double min_latitude,
                                                    double max_latitude,
                                                    double min_longitude,
                                                    double max_longitude,
                                                    String marker_type) {

        List<Marker> listRaw;

        if (marker_type == null || marker_type.isBlank()) {
            listRaw = markerRepository.findAllInBounds(min_latitude, max_latitude, min_longitude, max_longitude);
        } else {
            listRaw = markerRepository.findAllInBoundsByType(marker_type.trim(), min_latitude, max_latitude, min_longitude, max_longitude);
        }

        List<MarkerPublicDto> list = new ArrayList<>();

        for (Marker marker : listRaw) {
            list.add(toMarkerPublicDto(marker));
        }

        return list;
    }

    // UUID로 마커 1개 가져오기 (없으면 null)
    public MarkerPublicDto getMarker(String marker_uuid) {
        Marker marker = getMarkerEntity(marker_uuid);

        if (marker == null) {
            return null;
        }

        return toMarkerPublicDto(marker);
    }

    // 즐겨찾기 서비스에서 마커 엔티티가 필요할 때 쓴다 (없으면 null)
    public Marker getMarkerEntity(String marker_uuid) {
        if (marker_uuid == null || marker_uuid.isBlank()) {
            return null;
        }

        return markerRepository.findByMarkerUuid(marker_uuid.trim()).orElse(null);
    }

    // 엔티티를 응답용 DTO로 바꾸기
    private MarkerPublicDto toMarkerPublicDto(Marker marker) {
        return new MarkerPublicDto(
                marker.getMarker_uuid(),
                marker.getMarker_name(),
                marker.getMarker_type(),
                marker.getLatitude(),
                marker.getLongitude()
        );
    }
}
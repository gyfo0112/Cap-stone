package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.FavoriteEditRequestDto;
import com.safetymap.safetymap.dto.FavoriteListDto;
import com.safetymap.safetymap.dto.FavoriteRegisterDto;
import com.safetymap.safetymap.entity.Favorite;
import com.safetymap.safetymap.entity.Marker;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.repository.FavoriteRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FavoriteService {

    private static final int FAV_NAME_MAX_LENGTH = 50;

    private final FavoriteRepository favoriteRepository;
    private final UserService userService;
    private final MarkerService markerService;

    public FavoriteService(FavoriteRepository favoriteRepository, UserService userService, MarkerService markerService) {
        this.favoriteRepository = favoriteRepository;
        this.userService = userService;
        this.markerService = markerService;
    }

    // 내 즐겨찾기 목록
    public List<FavoriteListDto> getFavorites(String user_uuid) {
        List<FavoriteListDto> list = new ArrayList<>();

        if (user_uuid == null || user_uuid.isBlank()) {
            return list;
        }

        for (Favorite favorite : favoriteRepository.findAllByUserUuid(user_uuid.trim())) {
            list.add(toFavoriteListDto(favorite));
        }

        return list;
    }

    // 이미 담았는지 확인
    public boolean existsFavorite(String user_uuid, String marker_uuid) {
        if (user_uuid == null || user_uuid.isBlank() || marker_uuid == null || marker_uuid.isBlank()) {
            return false;
        }

        return favoriteRepository.countByUserUuidAndMarkerUuid(user_uuid.trim(), marker_uuid.trim()) > 0;
    }

    // 즐겨찾기 담기 (사용자나 마커가 없으면 null)
    //  - marker_uuid 가 있으면 이미 있는 마커를 담는다
    //  - 없으면 marker_name + latitude + longitude 로 장소(PLACE) 마커를 만들어 담는다
    public FavoriteListDto addFavorite(String user_uuid, FavoriteRegisterDto dto) {
        if (dto == null) {
            return null;
        }

        Users user = userService.getUserEntity(user_uuid);
        if (user == null) {
            return null;
        }

        Marker marker = getMarkerForFavorite(dto);
        if (marker == null) {
            return null;
        }

        Favorite favorite = new Favorite();

        favorite.setUser(user);
        favorite.setMarker(marker);
        favorite.setFav_name(cutFavName(dto.getFav_name()));

        favoriteRepository.save(favorite);

        return toFavoriteListDto(favorite);
    }

    // 담으려는 장소가 이미 내 즐겨찾기에 있는지 확인 (marker_uuid 없이 장소로 담을 때 쓴다)
    public boolean existsPlaceFavorite(String user_uuid, FavoriteRegisterDto dto) {
        if (dto == null || dto.getMarker_name() == null || dto.getLatitude() == null || dto.getLongitude() == null) {
            return false;
        }

        Marker marker = markerService.getPlaceMarkerEntity(dto.getMarker_name(), dto.getLatitude(), dto.getLongitude());
        if (marker == null) {
            return false;
        }

        return existsFavorite(user_uuid, marker.getMarker_uuid());
    }

    // 즐겨찾기 이름 변경 (없으면 null)
    public FavoriteListDto renameFavorite(String user_uuid, String marker_uuid, FavoriteEditRequestDto dto) {
        if (dto == null) {
            return null;
        }

        Favorite favorite = getFavorite(user_uuid, marker_uuid);
        if (favorite == null) {
            return null;
        }

        favorite.setFav_name(cutFavName(dto.getFav_name()));

        favoriteRepository.save(favorite);

        return toFavoriteListDto(favorite);
    }

    // 즐겨찾기 해제 (없으면 false)
    public boolean deleteFavorite(String user_uuid, String marker_uuid) {
        Favorite favorite = getFavorite(user_uuid, marker_uuid);

        if (favorite == null) {
            return false;
        }

        favoriteRepository.delete(favorite);

        return true;
    }

    // 요청에 맞는 마커 찾기 (marker_uuid 우선, 없으면 장소 마커를 찾거나 만든다)
    private Marker getMarkerForFavorite(FavoriteRegisterDto dto) {
        if (dto.getMarker_uuid() != null && !dto.getMarker_uuid().isBlank()) {
            return markerService.getMarkerEntity(dto.getMarker_uuid());
        }

        if (dto.getMarker_name() == null || dto.getMarker_name().isBlank() || dto.getLatitude() == null || dto.getLongitude() == null) {
            return null;
        }

        return markerService.getOrCreatePlaceMarker(dto.getMarker_name(), dto.getLatitude(), dto.getLongitude());
    }

    // 사용자 + 마커로 즐겨찾기 찾기 (없으면 null)
    private Favorite getFavorite(String user_uuid, String marker_uuid) {
        if (user_uuid == null || user_uuid.isBlank() || marker_uuid == null || marker_uuid.isBlank()) {
            return null;
        }

        return favoriteRepository.findByUserUuidAndMarkerUuid(user_uuid.trim(), marker_uuid.trim()).orElse(null);
    }

    // 즐겨찾기 이름 다듬기 (컬럼 길이 50자에 맞춘다)
    private String cutFavName(String fav_name) {
        if (fav_name == null || fav_name.isBlank()) {
            return null;
        }

        String name = fav_name.trim();

        if (name.length() > FAV_NAME_MAX_LENGTH) {
            name = name.substring(0, FAV_NAME_MAX_LENGTH);
        }

        return name;
    }

    // 엔티티를 응답용 DTO로 바꾸기
    private FavoriteListDto toFavoriteListDto(Favorite favorite) {
        return new FavoriteListDto(
                favorite.getUser().getUser_uuid(),
                favorite.getMarker().getMarker_uuid(),
                favorite.getMarker().getMarker_name(),
                favorite.getMarker().getMarker_type(),
                favorite.getMarker().getLatitude(),
                favorite.getMarker().getLongitude(),
                favorite.getFav_name()
        );
    }
}
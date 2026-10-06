package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.FavoriteEditRequestDto;
import com.safetymap.safetymap.dto.FavoriteListDto;
import com.safetymap.safetymap.dto.FavoriteRegisterDto;
import com.safetymap.safetymap.entity.Favorite;
import com.safetymap.safetymap.entity.Marker;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.repository.FavoriteRepository;
import com.safetymap.safetymap.repository.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FavoriteService {

    private static final int FAV_NAME_MAX_LENGTH = 50;

    private final FavoriteRepository favoriteRepository;
    private final UsersRepository usersRepository;
    private final MarkerService markerService;

    public FavoriteService(FavoriteRepository favoriteRepository, UsersRepository usersRepository, MarkerService markerService) {
        this.favoriteRepository = favoriteRepository;
        this.usersRepository = usersRepository;
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

    // 즐겨찾기 담기. 담았으면 true, 아래 경우에는 담지 않고 false
    //  - 요청이 비었거나 좌표가 잘못됨
    //  - 사용자나 마커를 찾을 수 없음
    //  - 이미 담은 마커(장소)
    // marker_uuid 가 있으면 이미 있는 마커를, 없으면 marker_name + latitude + longitude 로 장소(PLACE) 마커를 만들어 담는다
    public boolean addFavorite(String user_uuid, FavoriteRegisterDto dto) {
        if (dto == null || !isValidRequest(dto)) {
            return false;
        }

        Users user = getUser(user_uuid);
        if (user == null) {
            return false;
        }

        if (existsFavorite(user_uuid, dto.getMarker_uuid()) || existsPlaceFavorite(user_uuid, dto)) {
            return false;
        }

        Marker marker = getMarkerForFavorite(dto);
        if (marker == null) {
            return false;
        }

        Favorite favorite = new Favorite();

        favorite.setUser(user);
        favorite.setMarker(marker);
        favorite.setFav_name(cutFavName(dto.getFav_name()));

        favoriteRepository.save(favorite);

        return true;
    }

    // 담으려는 장소가 이미 내 즐겨찾기에 있는지 확인 (marker_uuid 없이 장소로 담을 때 쓴다)
    public boolean existsPlaceFavorite(String user_uuid, FavoriteRegisterDto dto) {
        if (dto == null || dto.getMarker_name() == null || dto.getLatitude() == null || dto.getLongitude() == null) {
            return false;
        }

        if (dto.getMarker_uuid() != null && !dto.getMarker_uuid().isBlank()) {
            return false;
        }

        Marker marker = markerService.getPlaceMarkerEntity(dto.getMarker_name(), dto.getLatitude(), dto.getLongitude());
        if (marker == null) {
            return false;
        }

        return existsFavorite(user_uuid, marker.getMarker_uuid());
    }

    // 즐겨찾기 이름 변경 (바꿨으면 true, 즐겨찾기가 없으면 false)
    public boolean renameFavorite(String user_uuid, String marker_uuid, FavoriteEditRequestDto dto) {
        if (dto == null) {
            return false;
        }

        Favorite favorite = getFavorite(user_uuid, marker_uuid);
        if (favorite == null) {
            return false;
        }

        favorite.setFav_name(cutFavName(dto.getFav_name()));

        favoriteRepository.save(favorite);

        return true;
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

    // UUID로 회원 찾기 (없으면 null)
    private Users getUser(String user_uuid) {
        if (user_uuid == null || user_uuid.isBlank()) {
            return null;
        }

        return usersRepository.findByUser_uuid(user_uuid.trim()).orElse(null);
    }

    // 담기 요청이 쓸 수 있는 모양인지: marker_uuid 가 있거나, 장소 이름 + 올바른 좌표가 있어야 한다
    private boolean isValidRequest(FavoriteRegisterDto dto) {
        if (dto.getMarker_uuid() != null && !dto.getMarker_uuid().isBlank()) {
            return true;
        }

        if (dto.getMarker_name() == null || dto.getMarker_name().isBlank() || dto.getLatitude() == null || dto.getLongitude() == null) {
            return false;
        }

        return dto.getLatitude() >= -90 && dto.getLatitude() <= 90 && dto.getLongitude() >= -180 && dto.getLongitude() <= 180;
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
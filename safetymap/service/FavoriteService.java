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

    // 즐겨찾기 담기 (사용자나 마커가 없으면 null)
    public FavoriteListDto addFavorite(String user_uuid, FavoriteRegisterDto dto) {
        if (dto == null) {
            return null;
        }

        Users user = getUser(user_uuid);
        if (user == null) {
            return null;
        }

        Marker marker = markerService.getMarkerEntity(dto.getMarker_uuid());
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

    // UUID로 회원 찾기 (없으면 null)
    private Users getUser(String user_uuid) {
        if (user_uuid == null || user_uuid.isBlank()) {
            return null;
        }

        return usersRepository.findByUserUuid(user_uuid.trim()).orElse(null);
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
package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.FavoriteEditRequestDto;
import com.safetymap.safetymap.dto.FavoriteListDto;
import com.safetymap.safetymap.dto.FavoriteRegisterDto;
import com.safetymap.safetymap.entity.Favorite;
import com.safetymap.safetymap.entity.Marker;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.exception.BadRequestException;
import com.safetymap.safetymap.exception.ConflictException;
import com.safetymap.safetymap.exception.NotFoundException;
import com.safetymap.safetymap.repository.FavoriteRepository;
import com.safetymap.safetymap.repository.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

// 즐겨찾기. user_uuid 는 항상 컨트롤러가 로그인 정보(userDetails.getUserUuid())에서 꺼내 넘긴다
// 중복·존재·소유권 검사는 여기서 하고, 문제가 있으면 공통 예외를 던진다 (GlobalExceptionHandler 가 상태코드로 바꿔 준다)
//  - 요청이 잘못됨          → BadRequestException (400)
//  - 사용자·마커·즐겨찾기 없음 → NotFoundException  (404)
//  - 이미 담은 마커          → ConflictException  (409)
// 다른 사람의 즐겨찾기는 "로그인 사용자 + marker_uuid" 로만 찾기 때문에 애초에 찾아지지 않는다 → 404
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

        if (!usersRepository.existsByUser_uuid(user_uuid)) {
            throw new NotFoundException("사용자를 찾을 수 없습니다.");
        }

        List<FavoriteListDto> list = new ArrayList<>();

        for (Favorite favorite : favoriteRepository.findAllByUserUuid(user_uuid)) {
            list.add(toFavoriteListDto(favorite));
        }

        return list;
    }

    // 즐겨찾기 담기
    // marker_uuid 가 있으면 이미 있는 마커를, 없으면 marker_name + latitude + longitude 로 장소(PLACE) 마커를 찾거나 만들어 담는다
    public void addFavorite(String user_uuid, FavoriteRegisterDto dto) {

        if (dto == null || !isValidRequest(dto)) {
            throw new BadRequestException("즐겨찾기할 마커 또는 장소 정보가 올바르지 않습니다.");
        }

        Users user = usersRepository.findByUser_uuid(user_uuid)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        Marker marker;

        if (hasMarkerUuid(dto)) {
            // 없는 marker_uuid 면 MarkerService 가 NotFoundException(404)
            marker = markerService.getMarkerEntity(dto.getMarker_uuid());
            checkNotFavorited(user_uuid, marker.getMarker_uuid());
        } else {
            // 같은 이름·좌표의 장소 마커가 이미 있고 내가 담아 뒀으면 409. 없으면 새로 만든다
            Marker place = markerService.getPlaceMarkerEntity(dto.getMarker_name(), dto.getLatitude(), dto.getLongitude());
            if (place != null) {
                checkNotFavorited(user_uuid, place.getMarker_uuid());
                marker = place;
            } else {
                marker = markerService.getOrCreatePlaceMarker(dto.getMarker_name(), dto.getLatitude(), dto.getLongitude());
            }
        }

        Favorite favorite = new Favorite();

        favorite.setUser(user);
        favorite.setMarker(marker);
        favorite.setFav_name(cutFavName(dto.getFav_name()));

        favoriteRepository.save(favorite);
    }

    // 즐겨찾기 이름 변경
    public void renameFavorite(String user_uuid, String marker_uuid, FavoriteEditRequestDto dto) {

        if (dto == null) {
            throw new BadRequestException("변경할 즐겨찾기 이름 정보가 없습니다.");
        }

        Favorite favorite = getMyFavorite(user_uuid, marker_uuid);

        favorite.setFav_name(cutFavName(dto.getFav_name()));

        favoriteRepository.save(favorite);
    }

    // 즐겨찾기 해제
    public void deleteFavorite(String user_uuid, String marker_uuid) {

        Favorite favorite = getMyFavorite(user_uuid, marker_uuid);

        favoriteRepository.delete(favorite);
    }

    // 이미 담았는지 확인
    public boolean existsFavorite(String user_uuid, String marker_uuid) {
        if (user_uuid == null || user_uuid.isBlank() || marker_uuid == null || marker_uuid.isBlank()) {
            return false;
        }

        return favoriteRepository.countByUserUuidAndMarkerUuid(user_uuid.trim(), marker_uuid.trim()) > 0;
    }

    // 이미 담은 마커면 409
    private void checkNotFavorited(String user_uuid, String marker_uuid) {

        if (existsFavorite(user_uuid, marker_uuid)) {
            throw new ConflictException("이미 즐겨찾기에 추가된 장소입니다.");
        }
    }

    // 로그인 사용자 범위 안에서 즐겨찾기 1개 찾기. 내 것이 아니거나 없으면 404
    private Favorite getMyFavorite(String user_uuid, String marker_uuid) {

        if (marker_uuid == null || marker_uuid.isBlank()) {
            throw new NotFoundException("즐겨찾기를 찾을 수 없습니다.");
        }

        return favoriteRepository.findByUserUuidAndMarkerUuid(user_uuid, marker_uuid.trim())
                .orElseThrow(() -> new NotFoundException("즐겨찾기를 찾을 수 없습니다."));
    }

    private boolean hasMarkerUuid(FavoriteRegisterDto dto) {
        return dto.getMarker_uuid() != null && !dto.getMarker_uuid().isBlank();
    }

    // 담기 요청이 쓸 수 있는 모양인지: marker_uuid 가 있거나, 장소 이름 + 올바른 좌표가 있어야 한다
    private boolean isValidRequest(FavoriteRegisterDto dto) {
        if (hasMarkerUuid(dto)) {
            return true;
        }

        if (dto.getMarker_name() == null || dto.getMarker_name().isBlank() || dto.getLatitude() == null || dto.getLongitude() == null) {
            return false;
        }

        return dto.getLatitude() >= -90 && dto.getLatitude() <= 90 && dto.getLongitude() >= -180 && dto.getLongitude() <= 180;
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

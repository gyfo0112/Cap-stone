package com.safetymap.safetymap.service;

import com.safetymap.safetymap.entity.Marker;
import com.safetymap.safetymap.repository.MarkerRepository;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;

import java.nio.charset.Charset;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MarkerImportService {

    private final MarkerRepository markerRepository;

    private static final int BATCH_SIZE = 1000;

    /*
     * 공공데이터 CSV 인코딩.
     * 파일이 UTF-8인 경우에는 UTF-8로 변경합니다.
     */
    private static final Charset CSV_CHARSET =
            Charset.forName("CP949");


    public MarkerImportService(MarkerRepository markerRepository) {
        this.markerRepository = markerRepository;
    }


    /*
     * MarkerDataImportRunner에서 호출하는 진입점
     */
    public void importMarkerData() {

        System.out.println("===== 마커 데이터 적재 시작 =====");

        importSecurityLight();
        importSafeHouse();
        importCctv();
        importEmergencyBell();

        System.out.println("===== 마커 데이터 적재 완료 =====");
    }


    /*
     * 전국 보안등
     */
    private void importSecurityLight() {

        importCsv(
                "data/전국보안등정보표준데이터.csv",

                "보안등",
                "SECURITY_LIGHT",

                "위도",
                "경도",

                null
        );
    }


    /*
     * 전국 안심지킴이집
     *
     * 이 데이터만 고정 이름 대신
     * CSV의 "점포명"을 marker_name으로 사용합니다.
     */
    private void importSafeHouse() {

        importCsv(
                "data/전국안심지킴이집표준데이터.csv",

                null,
                "SAFE_HOUSE",

                "위도",
                "경도",

                "점포명"
        );
    }


    /*
     * CCTV
     */
    private void importCctv() {

        importCsv(
                "data/CCTV정보.csv",

                "CCTV",
                "CCTV",

                "WGS84위도",
                "WGS84경도",

                null
        );
    }


    /*
     * 안전 비상벨
     */
    private void importEmergencyBell() {

        importCsv(
                "data/안전비상벨위치정보.csv",

                "비상벨",
                "EMERGENCY_BELL",

                "WGS84위도",
                "WGS84경도",

                null
        );
    }


    /*
     * 공통 CSV 처리
     *
     * fixedMarkerName
     *     고정 마커 이름.
     *     CCTV, 보안등, 비상벨 등에 사용.
     *
     * markerNameColumn
     *     원본 CSV에서 이름을 가져올 컬럼.
     *     안심지킴이집의 "점포명"에 사용.
     */
    private void importCsv(
            String filePath,
            String fixedMarkerName,
            String markerType,
            String latitudeColumn,
            String longitudeColumn,
            String markerNameColumn
    ) {

        int successCount = 0;
        int skipCount = 0;

        List<Marker> batch =
                new ArrayList<>(BATCH_SIZE);


        try {

            ClassPathResource resource =
                    new ClassPathResource(filePath);


            try (
                    Reader reader =
                            new BufferedReader(
                                    new InputStreamReader(
                                            resource.getInputStream(),
                                            CSV_CHARSET
                                    )
                            );

                    CSVParser parser =
                            CSVFormat.DEFAULT.builder()
                                    .setHeader()
                                    .setSkipHeaderRecord(true)
                                    .setIgnoreEmptyLines(true)
                                    .setTrim(true)
                                    .get()
                                    .parse(reader)
            ) {

                for (CSVRecord record : parser) {

                    try {

                        String latitudeValue =
                                record.get(latitudeColumn).trim();

                        String longitudeValue =
                                record.get(longitudeColumn).trim();


                        /*
                         * 좌표가 없는 데이터 제외
                         */
                        if (latitudeValue.isBlank()
                                || longitudeValue.isBlank()) {

                            skipCount++;
                            continue;
                        }


                        double latitude =
                                Double.parseDouble(latitudeValue);

                        double longitude =
                                Double.parseDouble(longitudeValue);


                        /*
                         * 비정상 좌표 제외
                         */
                        if (!isValidCoordinate(
                                latitude,
                                longitude
                        )) {

                            skipCount++;
                            continue;
                        }


                        String markerName;


                        /*
                         * 이름용 컬럼이 지정되어 있다면
                         * CSV에서 직접 읽습니다.
                         *
                         * 현재는 안심지킴이집의 점포명.
                         */
                        if (markerNameColumn != null) {

                            markerName =
                                    record.get(markerNameColumn)
                                            .trim();


                            /*
                             * 점포명이 비어있을 경우
                             */
                            if (markerName.isBlank()) {
                                markerName = "안심지킴이집";
                            }

                        } else {

                            /*
                             * 나머지는 고정 이름
                             */
                            markerName = fixedMarkerName;
                        }


                        /*
                         * DB의 marker_name이 VARCHAR(50)이므로
                         * 혹시 모를 초과값 방지
                         */
                        if (markerName.length() > 50) {

                            markerName =
                                    markerName.substring(0, 50);
                        }


                        /*
                         * Marker 엔티티 생성
                         */
                        Marker marker = new Marker();


                        /*
                         * idx는 AUTO_INCREMENT이므로
                         * 따로 입력하지 않습니다.
                         */
                        marker.setMarker_uuid(
                                UUID.randomUUID().toString()
                        );

                        marker.setMarker_name(
                                markerName
                        );

                        marker.setMarker_type(
                                markerType
                        );

                        marker.setLatitude(
                                latitude
                        );

                        marker.setLongitude(
                                longitude
                        );


                        batch.add(marker);


                        /*
                         * 1000건 단위 저장
                         */
                        if (batch.size() >= BATCH_SIZE) {

                            markerRepository.saveAll(batch);
                            markerRepository.flush();

                            successCount += batch.size();

                            batch.clear();


                            System.out.println(
                                    "[" + markerType + "] "
                                            + successCount
                                            + "건 저장"
                            );
                        }

                    } catch (Exception e) {

                        /*
                         * 특정 행 하나가 잘못됐더라도
                         * 전체 적재는 계속 진행
                         */
                        skipCount++;
                    }
                }


                /*
                 * 마지막 1000건 미만 데이터 저장
                 */
                if (!batch.isEmpty()) {

                    markerRepository.saveAll(batch);
                    markerRepository.flush();

                    successCount += batch.size();

                    batch.clear();
                }
            }


            System.out.println(
                    "===== [" + markerType + "] 완료 ====="
            );

            System.out.println(
                    "저장: " + successCount
                            + "건 / 제외: "
                            + skipCount + "건"
            );


        } catch (Exception e) {

            System.err.println(
                    "[" + markerType
                            + "] CSV 처리 중 오류 발생"
            );

            e.printStackTrace();
        }
    }


    /*
     * 한국 영역을 크게 벗어나는 좌표 제거
     *
     * 이전 CSV에서 발견했던
     * 0,0 / 위경도 뒤바뀜 / 200 이상 경도 등의
     * 명백한 오류를 제외하기 위한 용도입니다.
     */
    private boolean isValidCoordinate(
            double latitude,
            double longitude
    ) {

        return latitude >= 33.0
                && latitude <= 39.5
                && longitude >= 124.0
                && longitude <= 132.0;
    }
}
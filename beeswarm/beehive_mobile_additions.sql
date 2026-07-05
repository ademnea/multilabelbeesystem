-- ============================================================
-- Beeswarm Mobile App – Database Additions
-- Generated: 2026-05-04
-- Applies on top of: beehive (1).sql  (the web-admin schema)
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
-- 1. beehives – add GPS coordinates for the Map screen
-- ============================================================

ALTER TABLE `beehives`
  ADD COLUMN `latitude`  DECIMAL(10, 8) NULL DEFAULT NULL AFTER `hive_location`,
  ADD COLUMN `longitude` DECIMAL(11, 8) NULL DEFAULT NULL AFTER `latitude`;

-- Seed coordinates for existing hives
UPDATE `beehives` SET `latitude` = 0.34760000, `longitude` = 32.58250000 WHERE `id` = 'BH0001';
UPDATE `beehives` SET `latitude` = 0.34920000, `longitude` = 32.58510000 WHERE `id` = 'BH0002';

-- ============================================================
-- 2. alerts – add acknowledgment tracking
--    Mobile app calls acknowledgeAlert() / acknowledgeHiveAlert()
-- ============================================================

ALTER TABLE `alerts`
  MODIFY COLUMN `status` ENUM('pending','sent','acknowledged') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  ADD COLUMN `acknowledged_by`  VARCHAR(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL AFTER `status`,
  ADD COLUMN `acknowledged_at`  TIMESTAMP NULL DEFAULT NULL AFTER `acknowledged_by`,
  ADD KEY `alerts_acknowledged_by_foreign` (`acknowledged_by`);

ALTER TABLE `alerts`
  ADD CONSTRAINT `alerts_acknowledged_by_foreign`
    FOREIGN KEY (`acknowledged_by`) REFERENCES `beekeepers` (`id`) ON DELETE SET NULL;

-- ============================================================
-- 3. beekeeper_tokens – stateless mobile API authentication
--    Web admin uses Laravel sessions; mobile needs token-based auth
-- ============================================================

CREATE TABLE `beekeeper_tokens` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `beekeeper_id`  VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash`    VARCHAR(64)  COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHA-256 of the raw token',
  `device_name`   VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mobile',
  `last_used_at`  TIMESTAMP NULL DEFAULT NULL,
  `expires_at`    TIMESTAMP NULL DEFAULT NULL,
  `created_at`    TIMESTAMP NULL DEFAULT NULL,
  `updated_at`    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `beekeeper_tokens_token_hash_unique` (`token_hash`),
  KEY `beekeeper_tokens_beekeeper_id_foreign` (`beekeeper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `beekeeper_tokens`
  ADD CONSTRAINT `beekeeper_tokens_beekeeper_id_foreign`
    FOREIGN KEY (`beekeeper_id`) REFERENCES `beekeepers` (`id`) ON DELETE CASCADE;

-- ============================================================
-- 4. device_tokens – Expo push notification tokens
--    Backend needs these to push alerts to specific devices
-- ============================================================

CREATE TABLE `device_tokens` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `beekeeper_id`    VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expo_push_token` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform`        ENUM('ios','android','web') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'android',
  `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`      TIMESTAMP NULL DEFAULT NULL,
  `updated_at`      TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_tokens_expo_push_token_unique` (`expo_push_token`),
  KEY `device_tokens_beekeeper_id_foreign` (`beekeeper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `device_tokens`
  ADD CONSTRAINT `device_tokens_beekeeper_id_foreign`
    FOREIGN KEY (`beekeeper_id`) REFERENCES `beekeepers` (`id`) ON DELETE CASCADE;

-- ============================================================
-- 5. hive_sensor_readings – time-series temperature/humidity data
--    Powers Dashboard key metrics and HiveDetails metric graphs
-- ============================================================

CREATE TABLE `hive_sensor_readings` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hive_id`          VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `temperature_c`    DECIMAL(5, 2) NOT NULL COMMENT 'Internal hive temperature in Celsius',
  `humidity_percent` DECIMAL(5, 2) NOT NULL COMMENT 'Internal relative humidity 0–100',
  `weight_kg`        DECIMAL(7, 3) NULL DEFAULT NULL COMMENT 'Hive weight for nectar-flow estimation',
  `recorded_at`      TIMESTAMP NOT NULL COMMENT 'When the sensor captured the reading',
  `created_at`       TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hive_sensor_readings_hive_id_foreign` (`hive_id`),
  KEY `hive_sensor_readings_recorded_at_index` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `hive_sensor_readings`
  ADD CONSTRAINT `hive_sensor_readings_hive_id_foreign`
    FOREIGN KEY (`hive_id`) REFERENCES `beehives` (`id`) ON DELETE CASCADE;

-- Seed sample sensor data for existing hives (last 7 hours for BH0001)
INSERT INTO `hive_sensor_readings` (`hive_id`, `temperature_c`, `humidity_percent`, `weight_kg`, `recorded_at`, `created_at`) VALUES
('BH0001', 32.40, 63.00, 28.500, '2026-05-04 09:00:00', NOW()),
('BH0001', 33.10, 64.00, 28.520, '2026-05-04 10:00:00', NOW()),
('BH0001', 33.80, 66.00, 28.545, '2026-05-04 11:00:00', NOW()),
('BH0001', 34.50, 68.00, 28.570, '2026-05-04 12:00:00', NOW()),
('BH0001', 35.20, 69.00, 28.590, '2026-05-04 13:00:00', NOW()),
('BH0001', 34.80, 67.00, 28.580, '2026-05-04 14:00:00', NOW()),
('BH0001', 34.10, 65.00, 28.560, '2026-05-04 15:00:00', NOW()),
('BH0002', 33.50, 65.00, 24.100, '2026-05-04 09:00:00', NOW()),
('BH0002', 34.20, 66.00, 24.120, '2026-05-04 10:00:00', NOW()),
('BH0002', 34.90, 67.50, 24.150, '2026-05-04 11:00:00', NOW()),
('BH0002', 35.60, 70.00, 24.180, '2026-05-04 12:00:00', NOW()),
('BH0002', 36.10, 71.00, 24.195, '2026-05-04 13:00:00', NOW()),
('BH0002', 35.80, 69.00, 24.185, '2026-05-04 14:00:00', NOW()),
('BH0002', 35.10, 67.00, 24.165, '2026-05-04 15:00:00', NOW());

-- ============================================================
-- 6. audio_recordings – raw acoustic captures per hive
--    Powers "Recordings Today" and "Silent Hives" on Dashboard
-- ============================================================

CREATE TABLE `audio_recordings` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hive_id`          VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path`        VARCHAR(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Storage path to the audio file',
  `duration_seconds` SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  `file_size_kb`     INT UNSIGNED NULL DEFAULT NULL,
  `recorded_at`      TIMESTAMP NOT NULL,
  `processed_at`     TIMESTAMP NULL DEFAULT NULL COMMENT 'When the ML model consumed this recording',
  `inference_id`     BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Linked prediction result, if processed',
  `created_at`       TIMESTAMP NULL DEFAULT NULL,
  `updated_at`       TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audio_recordings_hive_id_foreign` (`hive_id`),
  KEY `audio_recordings_inference_id_foreign` (`inference_id`),
  KEY `audio_recordings_recorded_at_index` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `audio_recordings`
  ADD CONSTRAINT `audio_recordings_hive_id_foreign`
    FOREIGN KEY (`hive_id`) REFERENCES `beehives` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audio_recordings_inference_id_foreign`
    FOREIGN KEY (`inference_id`) REFERENCES `inferences` (`id`) ON DELETE SET NULL;

-- ============================================================
-- 7. inferences – expand prediction enum
--    Mobile Classification screen uses: disease, mite infestation,
--    queen loss, healthy — none of which existed in the original enum
-- ============================================================

ALTER TABLE `inferences`
  MODIFY COLUMN `prediction`
    ENUM(
      'Normal',
      'Healthy',
      'Pre-swarm',
      'Swarm',
      'Abscondment',
      'Disease',
      'Mite Infestation',
      'Queen Loss',
      'Uncertain'
    ) COLLATE utf8mb4_unicode_ci NOT NULL;

-- ============================================================
-- 8. hive_inspections – manual inspection log
--    Supports future inspection history screen on the mobile app
-- ============================================================

CREATE TABLE `hive_inspections` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hive_id`             VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inspected_by`        VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inspected_at`        TIMESTAMP NOT NULL,
  `queen_seen`          TINYINT(1) NOT NULL DEFAULT 0,
  `queen_cells_found`   TINYINT(1) NOT NULL DEFAULT 0,
  `brood_pattern`       ENUM('Good','Fair','Poor','None') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Good',
  `temper`              ENUM('Calm','Moderate','Aggressive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Calm',
  `disease_signs`       TINYINT(1) NOT NULL DEFAULT 0,
  `mite_count`          SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT 'Varroa mite count per 100 bees',
  `honey_stores`        ENUM('Full','Adequate','Low','Empty') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Adequate',
  `action_taken`        TEXT COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `notes`               TEXT COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at`          TIMESTAMP NULL DEFAULT NULL,
  `updated_at`          TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hive_inspections_hive_id_foreign` (`hive_id`),
  KEY `hive_inspections_inspected_by_foreign` (`inspected_by`),
  KEY `hive_inspections_inspected_at_index` (`inspected_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `hive_inspections`
  ADD CONSTRAINT `hive_inspections_hive_id_foreign`
    FOREIGN KEY (`hive_id`) REFERENCES `beehives` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hive_inspections_inspected_by_foreign`
    FOREIGN KEY (`inspected_by`) REFERENCES `beekeepers` (`id`) ON DELETE CASCADE;

-- ============================================================
-- 9. beekeepers – add profile_photo_url for the Profile screen
-- ============================================================

ALTER TABLE `beekeepers`
  ADD COLUMN `profile_photo_url` VARCHAR(500) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL AFTER `address`;

-- ============================================================
-- Migration record
-- ============================================================

INSERT INTO `migrations` (`migration`, `batch`) VALUES
  ('2026_05_04_000001_add_coordinates_to_beehives', 3),
  ('2026_05_04_000002_add_acknowledgment_to_alerts', 3),
  ('2026_05_04_000003_create_beekeeper_tokens_table', 3),
  ('2026_05_04_000004_create_device_tokens_table', 3),
  ('2026_05_04_000005_create_hive_sensor_readings_table', 3),
  ('2026_05_04_000006_create_audio_recordings_table', 3),
  ('2026_05_04_000007_expand_inferences_prediction_enum', 3),
  ('2026_05_04_000008_create_hive_inspections_table', 3),
  ('2026_05_04_000009_add_profile_photo_to_beekeepers', 3);

COMMIT;

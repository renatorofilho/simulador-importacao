CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `openId` varchar(64) NOT NULL UNIQUE,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `simulations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `regime` enum('simples-nacional','lucro-real','lucro-presumido') NOT NULL DEFAULT 'lucro-real',
  `ttd` enum('none','409','410') NOT NULL DEFAULT 'none',
  `incoterm` varchar(10) NOT NULL DEFAULT 'FOB',
  `cambio` decimal(10,4) NOT NULL,
  `freteInternacionalDolar` decimal(12,2) DEFAULT 0,
  `seguroInternacionalDolar` decimal(12,2) DEFAULT 0,
  `ratioMethod` enum('cif','peso','volume','valor') NOT NULL DEFAULT 'cif',
  `taxRatesJson` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `simulationItems` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `simulationId` int NOT NULL,
  `ncm` varchar(8) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(12,4) NOT NULL,
  `unitWeight` decimal(12,4) NOT NULL,
  `unitVolume` decimal(12,4) NOT NULL,
  `unitValueUsd` decimal(12,2) NOT NULL,
  `ii` decimal(5,4) NOT NULL,
  `ipi` decimal(5,4) NOT NULL,
  `pis` decimal(5,4) NOT NULL,
  `cofins` decimal(5,4) NOT NULL,
  `totalWeightKg` decimal(14,4),
  `totalVolumeM3` decimal(14,4),
  `totalValueUsd` decimal(14,2),
  `valorAduaneiro` decimal(14,2),
  `ii_value` decimal(14,2),
  `ipi_value` decimal(14,2),
  `pis_value` decimal(14,2),
  `cofins_value` decimal(14,2),
  `icms_value` decimal(14,2),
  `precoUnitarioCif` decimal(14,2),
  `precoDesembaracado` decimal(14,2),
  `fatorImportacao` decimal(10,4),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ncmCache` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ncm` varchar(8) NOT NULL UNIQUE,
  `description` varchar(255) NOT NULL,
  `ii` decimal(5,4) NOT NULL,
  `ipi` decimal(5,4) NOT NULL,
  `pis` decimal(5,4) NOT NULL,
  `cofins` decimal(5,4) NOT NULL,
  `rawDataJson` text,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ncmQueryHistory` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `ncm` varchar(8) NOT NULL,
  `description` varchar(255),
  `source` enum('api','cache') NOT NULL,
  `success` boolean DEFAULT true NOT NULL,
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

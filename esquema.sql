
CREATE DATABASE credenciales;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(1000) DEFAULT NULL,
  `rut` varchar(12) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `contrasena` varchar(255) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT 'Inactivo',
  `primer_inicio` tinyint(1) DEFAULT '1',
  `debe_cambiar_contrasena` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

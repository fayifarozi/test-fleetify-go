INSERT IGNORE INTO `users` (`username`, `password`, `role`, `created_at`, `updated_at`) VALUES
('admin', '$2a$10$YourBcryptHashHereForAdmin123', 'admin', NOW(), NOW()),
('kerani', '$2a$10$YourBcryptHashHereForKerani123', 'kerani', NOW(), NOW());

INSERT IGNORE INTO `items` (`code`, `name`, `price`, `created_at`, `updated_at`) VALUES
('BRG-001', 'Ban Truk Bridgestone R22.5', 3500000.00, NOW(), NOW()),
('BRG-002', 'Oli Mesin Pertamina Meditran 10L', 450000.00, NOW(), NOW()),
('BRG-003', 'Filter Udara Hino 500', 275000.00, NOW(), NOW()),
('BRG-004', 'Kampas Rem Depan Set', 850000.00, NOW(), NOW()),
('BRG-005', 'Aki GS Astra 12V 100Ah', 1750000.00, NOW(), NOW()),
('BRG-006', 'Lampu Sein LED 24V', 125000.00, NOW(), NOW()),
('BRG-007', 'V-Belt Fan Alternator', 95000.00, NOW(), NOW()),
('BRG-008', 'Selang Radiator Atas', 180000.00, NOW(), NOW()),
('BRG-009', 'Mur Roda Truk Set (10pcs)', 320000.00, NOW(), NOW()),
('BRG-010', 'Wiper Blade 24 inch', 85000.00, NOW(), NOW());

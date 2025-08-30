-- Add missing area code 213 for Los Angeles
INSERT INTO area_codes (
    country_id,
    area_code,
    city,
    base_price,
    sms_addon_price,
    is_sms_capable,
    is_available
) VALUES (
    '2c03ce0d-e4db-495e-af00-7251116b4ce8', -- US country ID
    '213',
    'Los Angeles',
    3.00,
    2.00,
    true,
    true
);

-- Verify it was added
SELECT area_code, city FROM area_codes 
WHERE country_id = '2c03ce0d-e4db-495e-af00-7251116b4ce8' 
AND area_code IN ('212', '213')
ORDER BY area_code;
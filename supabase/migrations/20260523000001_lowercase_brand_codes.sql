-- Lowercase existing brand_code values in outlets and profiles
UPDATE outlets SET brand_code = LOWER(brand_code) WHERE brand_code != LOWER(brand_code);
UPDATE profiles SET brand_code = LOWER(brand_code) WHERE brand_code != LOWER(brand_code);

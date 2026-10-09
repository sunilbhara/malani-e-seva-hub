-- Studio photos keep their own shape (portrait or landscape). The seeded image URLs asked the
-- CDN for a forced 900×1200 crop, which cut landscape wedding photos; ask for a size limit instead.
-- New uploads keep their aspect ratio in the browser (src/lib/catalogImage.ts).

update public.catalog_items
set image_url = replace(image_url, 'w=900&h=1200&fit=crop', 'w=1200')
where kind = 'studio_photo' and image_url like 'https://images.unsplash.com/%w=900&h=1200&fit=crop%';

update public.catalog_items
set image_url = replace(image_url, 'w_900,h_1200,c_fill', 'w_1200,c_limit')
where kind = 'studio_photo' and image_url like 'https://res.cloudinary.com/%w_900,h_1200,c_fill%';

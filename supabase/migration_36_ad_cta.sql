-- Ad ke neeche wale button ka text (Shop Now / Visit Now / Install ...). Ek baar chalao.
alter table ads add column if not exists cta_text text;

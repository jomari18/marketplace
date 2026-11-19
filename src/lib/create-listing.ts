import { getSupabase } from "./supabase";
import {
  ALLOWED_PHOTO_TYPES,
  EMAIL_PATTERN,
  LIMITS,
  MAX_PHOTO_BYTES,
  PHOTO_BUCKET,
  isCategory,
} from "./constants";

export type ListingInput = {
  title: string;
  description: string;
  price: string;
  category: string;
  sellerEmail: string;
  photo: File | null;
};

export type FieldErrors = Partial<Record<keyof ListingInput, string>>;

/** Check the form in the browser first, with friendly messages. */
export function validateListing(input: ListingInput): FieldErrors {
  const errors: FieldErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();
  const price = Number(input.price);

  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) {
    errors.title = `Title must be ${LIMITS.titleMin}–${LIMITS.titleMax} characters.`;
  }
  if (description.length < LIMITS.descriptionMin || description.length > LIMITS.descriptionMax) {
    errors.description = `Description must be ${LIMITS.descriptionMin}–${LIMITS.descriptionMax} characters.`;
  }
  if (input.price.trim() === "" || !Number.isFinite(price) || price < 0 || price > LIMITS.priceMax) {
    errors.price = "Enter a price from 0 to 10,000,000.";
  }
  if (!isCategory(input.category)) {
    errors.category = "Choose a category.";
  }
  if (!EMAIL_PATTERN.test(input.sellerEmail.trim()) || input.sellerEmail.length > LIMITS.emailMax) {
    errors.sellerEmail = "Enter a valid email, like you@example.com.";
  }
  if (!input.photo) {
    errors.photo = "Add a photo of your item.";
  } else if (!ALLOWED_PHOTO_TYPES.includes(input.photo.type)) {
    errors.photo = "Please choose a JPG, PNG, GIF or WebP image.";
  } else if (input.photo.size > MAX_PHOTO_BYTES) {
    errors.photo = "That photo is over 5 MB. Please choose a smaller one.";
  }
  return errors;
}

/** Upload the photo to Supabase Storage under a random name; return its public URL. */
async function uploadPhoto(file: File): Promise<string> {
  const supabase = getSupabase();
  const extension = file.type.split("/")[1]; // "image/png" -> "png"
  const path = `${crypto.randomUUID()}.${extension}`; // random: no guessing, no overwriting

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** 1) upload the photo, 2) insert the listing row. Returns the new listing id. */
export async function createListing(input: ListingInput): Promise<string> {
  if (!input.photo) throw new Error("Photo is required");
  const imageUrl = await uploadPhoto(input.photo);

  const { data, error } = await getSupabase()
    .from("listings")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      price: Number(input.price),
      category: input.category,
      seller_email: input.sellerEmail.trim().toLowerCase(),
      image_url: imageUrl,
    })
    .select("id") // only ask for the id back; seller_email is never returned
    .single();

  if (error) throw error;
  return data.id as string;
}

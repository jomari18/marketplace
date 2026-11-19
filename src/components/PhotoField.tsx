"use client";

import { useEffect, useState } from "react";
import { ALLOWED_PHOTO_TYPES } from "@/lib/constants";

type PhotoFieldProps = {
  photo: File | null;
  error?: string;
  disabled: boolean;
  onChange: (file: File | null) => void;
};

/** Photo picker with a large preview, in the product-card proportions. */
export default function PhotoField({ photo, error, disabled, onChange }: PhotoFieldProps) {
  // Temporary local URL for the preview, released when the photo changes.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <div className="field">
      <span className="field__label" id="photo-label">
        Photo
      </span>
      <div className={`photo-drop${previewUrl ? " has-photo" : ""}${error ? " is-invalid" : ""}`}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Preview of your item photo" className="photo-drop__preview" />
        ) : (
          <p className="photo-drop__hint">
            <strong>Add a photo</strong>
            <span>JPG, PNG, GIF or WebP · max 5 MB</span>
          </p>
        )}
        <input
          id="photo"
          type="file"
          accept={ALLOWED_PHOTO_TYPES.join(",")}
          className="photo-drop__input"
          aria-labelledby="photo-label"
          aria-describedby={error ? "photo-error" : undefined}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.files?.[0] ?? null);
            e.target.value = ""; // allow picking the same file again
          }}
        />
      </div>
      {photo && (
        <div className="photo-drop__actions">
          <span className="muted photo-drop__name">{photo.name}</span>
          <button type="button" className="text-button" onClick={() => onChange(null)} disabled={disabled}>
            Remove photo
          </button>
        </div>
      )}
      {error && (
        <p id="photo-error" className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

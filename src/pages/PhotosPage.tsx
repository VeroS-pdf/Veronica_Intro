/**
 * PhotosPage: a wall of simple black frames for pictures of paintings and drawings.
 *
 * Each frame shows its picture if the entry in `PHOTOS` (inside `src/config/siteConfig.ts`)
 * has an `image`; otherwise it shows an empty placeholder. The picture files live in
 * the `public/photos/` folder. The instructions for adding one are above `PHOTOS`.
 */
import { PICTURE_PLACEHOLDER } from '../art/sprites';
import { PageShell } from '../components/PageShell';
import { PixelSprite } from '../components/PixelSprite';
import { PHOTOS } from '../config/siteConfig';

/** Where a picture's file really is: the `public/photos/` folder (`BASE_URL` keeps this right wherever the site is hosted). */
const photoUrl = (fileName: string) => `${import.meta.env.BASE_URL}photos/${fileName}`;

export function PhotosPage() {
  return (
    <PageShell title={PHOTOS.heading}>
      <p className="gallery__intro">{PHOTOS.intro}</p>
      <ul className="gallery">
        {PHOTOS.items.map((photo, index) => (
          <li key={`${index}-${photo.title}`} className={`gallery__item gallery__item--${photo.shape ?? 'landscape'}`}>
            <figure className="frame">
              <div className="frame__picture">
                {photo.image ? (
                  <img src={photoUrl(photo.image)} alt={photo.title} loading="lazy" />
                ) : (
                  <span className="frame__empty" role="img" aria-label={`Empty frame for ${photo.title}`}>
                    <PixelSprite sprite={PICTURE_PLACEHOLDER} scale={1.5} />
                    your picture here
                  </span>
                )}
              </div>
              <figcaption>
                <p className="frame__title">{photo.title}</p>
                {photo.caption && <p className="frame__note">{photo.caption}</p>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

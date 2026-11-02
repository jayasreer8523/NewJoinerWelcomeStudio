interface Props {
  src: string;
  alt: string;
}

/** Shows the original image uncropped (object-fit: contain). Stage 2 crop/zoom controls would extend this component. */
export default function PhotoPreview({ src, alt }: Props) {
  return (
    <div className="photo-frame">
      <img src={src} alt={alt} />
    </div>
  );
}

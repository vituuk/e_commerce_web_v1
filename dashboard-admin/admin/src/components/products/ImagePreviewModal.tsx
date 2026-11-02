import { Close } from '@/components/Close'
import { asterLinenFront } from '@/assets/img'
import { useI18n } from '@/assets/i18n'

export interface ImagePreviewModalProps {
  previewImage: { src: string; title?: string } | null
  onClose: () => void
}

export function ImagePreviewModal({ previewImage, onClose }: ImagePreviewModalProps) {
  const { t } = useI18n()

  if (!previewImage) return null

  return (
    <div
      className="crud-backdrop image-popup-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="image-popup-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={previewImage.title || 'Image preview'}
      >
        <div className="image-popup-header">
          <strong>{previewImage.title || t('Image')}</strong>
          <Close variant="icon" onClick={onClose} aria-label="Close image preview" />
        </div>
        <div className="image-popup-body">
          <img
            src={previewImage.src}
            alt={previewImage.title || 'Preview'}
            className="image-popup-img"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = asterLinenFront
            }}
          />
        </div>
        <div className="image-popup-footer">
          <Close onClick={onClose} />
        </div>
      </section>
    </div>
  )
}

export default ImagePreviewModal


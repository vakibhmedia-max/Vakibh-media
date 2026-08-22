document.addEventListener('DOMContentLoaded', () => {
  const adminNav = document.querySelector('.admin-nav');
  if (adminNav && !adminNav.querySelector('a[href="/admin/contact-inquiries"]')) {
    const inquiryLink = document.createElement('a');
    inquiryLink.href = '/admin/contact-inquiries';
    inquiryLink.className = document.body.classList.contains('admin-contact-inquiries-page') ? 'active' : '';
    inquiryLink.innerHTML = '<i class="fas fa-envelope-open-text"></i> संपर्क चौकशी';
    const feedbackLink = adminNav.querySelector('a[href="/admin/comments"]');
    feedbackLink?.insertAdjacentElement('afterend', inquiryLink);
  }

  const dateRange = document.querySelector('[data-date-range]');
  const customDates = document.querySelectorAll('.admin-custom-date');
  const syncCustomDates = () => customDates.forEach((field) => {
    field.hidden = dateRange?.value !== 'custom';
  });
  dateRange?.addEventListener('change', syncCustomDates);
  syncCustomDates();

  const editor = document.querySelector('[data-blog-editor]');
  if (!editor) return;

  const titleInput = editor.querySelector('[data-autoslug-source]');
  const slugInput = editor.querySelector('[data-autoslug-target]');
  const excerptInput = editor.querySelector('textarea[name="excerpt"]');
  const contentInput = editor.querySelector('textarea[name="content_html"]');
  const categoryInput = editor.querySelector('[name="category"]');
  const authorInput = editor.querySelector('input[name="author_name"]');
  const labelInput = editor.querySelector('input[name="card_label"]');
  const imageUrlInput = editor.querySelector('input[name="featured_image"]');
  const altInput = editor.querySelector('input[name="featured_image_alt"]');
  const statusInput = editor.querySelector('select[name="status"]');
  const orderInput = editor.querySelector('input[name="sort_order"]');
  const fileInput = editor.querySelector('input[type="file"][data-image-upload]');

  const previewImage = editor.querySelector('[data-preview-image]');
  const previewTag = editor.querySelector('[data-preview-tag]');
  const previewLabel = editor.querySelector('[data-preview-label]');
  const previewTitle = editor.querySelector('[data-preview-title]');
  const previewTitleFull = editor.querySelector('[data-preview-title-full]');
  const previewAuthor = editor.querySelector('[data-preview-author]');
  const previewExcerpt = editor.querySelector('[data-preview-excerpt]');
  const previewContent = editor.querySelector('[data-preview-content]');
  const previewStatus = editor.querySelector('[data-preview-status]');
  const previewOrder = editor.querySelector('[data-preview-order]');

  const normalizeSlug = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

  let slugTouched = Boolean(slugInput?.value?.trim());
  let objectUrl = null;

  const getFallbackLabel = () => {
    const order = orderInput?.value || '1';
    return `लेख ${order}`;
  };

  const updateSlug = () => {
    if (!titleInput || !slugInput || slugTouched) return;
    const generated = normalizeSlug(titleInput.value);
    if (generated) {
      slugInput.value = generated;
    }
  };

  const updateImagePreview = () => {
    if (!previewImage) return;
    const file = fileInput?.files?.[0];
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    if (file) {
      objectUrl = URL.createObjectURL(file);
      previewImage.src = objectUrl;
      if (altInput?.value) {
        previewImage.alt = altInput.value;
      }
      return;
    }

    const fallback = imageUrlInput?.value?.trim() || previewImage.dataset.fallback || '/assests/hero-bg.jpg';
    previewImage.src = fallback;
    previewImage.alt = altInput?.value || titleInput?.value || 'वाकीभ ब्लॉग प्रतिमा';
  };

  const updatePreview = () => {
    const title = titleInput?.value?.trim() || 'लेख शीर्षक';
    const category = categoryInput?.value?.trim() || 'संत साहित्य';
    const author = authorInput?.value?.trim() || 'वाकीभ संपादकीय मंडळ';
    const label = labelInput?.value?.trim() || getFallbackLabel();
    const excerpt = excerptInput?.value?.trim() || 'इथे excerpt preview दिसेल.';
    const status = statusInput?.value || 'draft';
    const order = orderInput?.value || '1';
    const content = contentInput?.value?.trim() || '<p>HTML preview येथे दिसेल.</p>';
    const alt = altInput?.value?.trim() || title;

    if (previewTag) previewTag.textContent = category;
    if (previewLabel) previewLabel.textContent = label;
    if (previewTitle) previewTitle.textContent = title;
    if (previewTitleFull) previewTitleFull.textContent = title;
    if (previewAuthor) previewAuthor.textContent = author;
    if (previewExcerpt) previewExcerpt.textContent = excerpt;
    if (previewStatus) previewStatus.textContent = status;
    if (previewOrder) previewOrder.textContent = `Order ${order}`;
    if (previewContent) previewContent.innerHTML = content;
    if (previewImage) previewImage.alt = alt;
    updateImagePreview();
  };

  titleInput?.addEventListener('input', () => {
    updateSlug();
    updatePreview();
  });

  slugInput?.addEventListener('input', () => {
    slugTouched = true;
  });

  [
    excerptInput,
    contentInput,
    categoryInput,
    authorInput,
    labelInput,
    imageUrlInput,
    altInput,
    statusInput,
    orderInput
  ].forEach((field) => {
    field?.addEventListener('input', updatePreview);
    field?.addEventListener('change', updatePreview);
  });

  fileInput?.addEventListener('change', updateImagePreview);

  updatePreview();
});

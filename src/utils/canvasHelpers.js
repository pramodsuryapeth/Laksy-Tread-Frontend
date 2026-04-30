import { Image as FabricImage } from 'fabric';

/**
 * Loads a background image onto the canvas (e.g., t‑shirt mockup).
 * @param {fabric.Canvas} canvas - Fabric canvas instance.
 * @param {string} imageUrl - URL of the background image.
 * @param {Object} [options] - Optional settings.
 * @param {string|number} [options.scaleMode='fit'] - 'fit' (80% of canvas width), 'cover', 'original', or a custom number.
 * @param {boolean} [options.useBackgroundAPI=true] - Use setBackgroundImage (recommended). Falls back to manual layer if false.
 * @returns {Promise<void>}
 */
export const loadShirtBackground = async (canvas, imageUrl, options = {}) => {
  if (!canvas || !imageUrl) return;

  const {
    scaleMode = 'fit',
    useBackgroundAPI = true,
  } = options;

  try {
    console.log("🖼️ Loading shirt background:", imageUrl);

    // Load image with CORS support
    const htmlImg = await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });

    const fabricImage = new FabricImage(htmlImg);

    // --- Sizing logic (original behaviour: scale to 80% of canvas width when scaleMode = 'fit')
    if (scaleMode === 'fit') {
      // Original behaviour: scale to 80% of canvas width
      fabricImage.scaleToWidth(canvas.width * 0.8);
    } else if (scaleMode === 'cover') {
      // Scale to cover the whole canvas (may crop)
      const scaleX = canvas.width / fabricImage.width;
      const scaleY = canvas.height / fabricImage.height;
      const scale = Math.max(scaleX, scaleY);
      fabricImage.scale(scale);
    } else if (scaleMode === 'original') {
      // No scaling
      fabricImage.scale(1);
    } else if (typeof scaleMode === 'number') {
      // Custom scale factor
      fabricImage.scale(scaleMode);
    }

    // Center the image
    fabricImage.set({
      left: canvas.width / 2,
      top: canvas.height / 2,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
    });

    if (useBackgroundAPI && canvas.setBackgroundImage) {
      // ✅ Preferred method: sets as real background, undo‑friendly, auto‑rendered
      canvas.setBackgroundImage(fabricImage, canvas.renderAll.bind(canvas), {
        originX: 'center',
        originY: 'center',
        left: canvas.width / 2,
        top: canvas.height / 2,
      });
      fabricImage.isBackground = true; // optional marker
    } else {
      // 🔁 Fallback: manual layer (original approach, keeps compatibility)
      // Remove any existing objects flagged as background
      const objects = canvas.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        if (objects[i].isBackground) {
          canvas.remove(objects[i]);
        }
      }
      fabricImage.isBackground = true;
      canvas.add(fabricImage);
      canvas.sendObjectToBack(fabricImage);
    }

    canvas.requestRenderAll();
    console.log("🎯 Background applied successfully");

  } catch (err) {
    console.error("❌ Failed to load shirt background:", err);
    throw err; // let caller handle
  }
};
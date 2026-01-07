/**
 * 导出画布为图片的工具函数
 * 支持导出 AvatarCanvas 和绘制 Canvas 的合并内容
 */

import html2canvas from "html2canvas";

export interface ExportOptions {
  /** AvatarCanvas 容器元素 */
  avatarCanvasElement: HTMLElement | null;
  /** 绘制 Canvas 元素（可选） */
  drawingCanvasElement: HTMLCanvasElement | null;
  /** 导出质量（1-3，默认 2） */
  scale?: number;
  /** 背景色（默认透明） */
  backgroundColor?: string | null;
}

/**
 * 导出画布为图片
 * @param options 导出选项
 * @returns Promise<string | null> 返回 data URL，失败返回 null
 */
export async function exportCanvasToImage(
  options: ExportOptions
): Promise<string | null> {
  const {
    avatarCanvasElement,
    drawingCanvasElement,
    scale = 2,
    backgroundColor = null,
  } = options;

  if (!avatarCanvasElement) {
    console.error("AvatarCanvas element not found");
    return null;
  }

  try {
    // 如果存在绘制 canvas，需要先合并内容
    if (drawingCanvasElement) {
      return await exportWithDrawingCanvas(
        avatarCanvasElement,
        drawingCanvasElement,
        scale,
        backgroundColor
      );
    }

    // 否则直接导出 AvatarCanvas
    const canvas = await html2canvas(avatarCanvasElement, {
      backgroundColor,
      scale,
      useCORS: true,
      logging: false,
      allowTaint: false,
      // FIX: Handle stretched images (like eyes) by enforcing height: auto
      onclone: (clonedDoc) => {
        const images = clonedDoc.getElementsByTagName("img");
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          // If images are stretching, forcing height to auto usually fixes
          // aspect ratio issues in html2canvas captures
          img.style.height = "auto";
        }
      },
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to export canvas:", error);
    return null;
  }
}

/**
 * 导出包含绘制内容的画布
 */
async function exportWithDrawingCanvas(
  avatarCanvasElement: HTMLElement,
  drawingCanvasElement: HTMLCanvasElement,
  scale: number,
  backgroundColor: string | null
): Promise<string | null> {
  try {
    // 1. 先导出 AvatarCanvas
    const avatarCanvas = await html2canvas(avatarCanvasElement, {
      backgroundColor,
      scale,
      useCORS: true,
      logging: false,
      allowTaint: false,
      // FIX: Apply the same fix for the merged export case
      onclone: (clonedDoc) => {
        const images = clonedDoc.getElementsByTagName("img");
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          img.style.height = "auto";
        }
      },
    });

    // 2. 创建一个新的 canvas 来合并内容
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = avatarCanvas.width;
    mergedCanvas.height = avatarCanvas.height;
    const mergedCtx = mergedCanvas.getContext("2d");

    if (!mergedCtx) {
      console.error("Failed to get 2d context for merged canvas");
      return null;
    }

    // 3. 绘制背景色（如果有）
    if (backgroundColor) {
      mergedCtx.fillStyle = backgroundColor;
      mergedCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
    }

    // 4. 绘制 AvatarCanvas 内容
    mergedCtx.drawImage(avatarCanvas, 0, 0);

    // 5. 获取绘制 canvas 的尺寸和位置信息
    const drawingRect = drawingCanvasElement.getBoundingClientRect();
    const avatarRect = avatarCanvasElement.getBoundingClientRect();

    // 计算绘制 canvas 相对于 AvatarCanvas 的位置和缩放
    const scaleX = mergedCanvas.width / avatarRect.width;
    const scaleY = mergedCanvas.height / avatarRect.height;

    // 计算绘制 canvas 在合并 canvas 中的位置
    const offsetX = (drawingRect.left - avatarRect.left) * scaleX;
    const offsetY = (drawingRect.top - avatarRect.top) * scaleY;

    // 计算绘制 canvas 的实际显示尺寸（考虑 devicePixelRatio）
    const drawingDisplayWidth = drawingRect.width;
    const drawingDisplayHeight = drawingRect.height;

    // 绘制 canvas 的内部尺寸可能已经考虑了 DPR，需要正确缩放
    // 如果 drawingCanvas 的 width/height 已经乘以了 DPR，我们需要除以它
    const drawingCanvasWidth = drawingCanvasElement.width;
    const drawingCanvasHeight = drawingCanvasElement.height;

    // 计算在合并 canvas 中的缩放尺寸
    const scaledDrawingWidth = drawingDisplayWidth * scaleX;
    const scaledDrawingHeight = drawingDisplayHeight * scaleY;

    // 6. 绘制绘制 canvas 的内容
    mergedCtx.drawImage(
      drawingCanvasElement,
      0,
      0,
      drawingCanvasWidth,
      drawingCanvasHeight, // source
      offsetX,
      offsetY,
      scaledDrawingWidth,
      scaledDrawingHeight // destination
    );

    return mergedCanvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to export with drawing canvas:", error);
    return null;
  }
}

/**
 * 下载图片
 * @param dataUrl 图片的 data URL
 * @param filename 文件名（可选，默认带时间戳）
 */
export function downloadImage(dataUrl: string, filename?: string): void {
  const link = document.createElement("a");
  link.download = filename || `avatar-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

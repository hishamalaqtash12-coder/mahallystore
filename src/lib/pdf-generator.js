import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { getProductIdentifier } from './product-utils';

// ─── Self-contained Arabic Shaper ───────────────────────────────────────────
// Maps isolated Arabic characters (U+0600..U+06FF) to their
// initial / medial / final / isolated Presentation Forms (U+FE70..U+FEFC).
// Each entry: [isolated, final, initial, medial]
const ARABIC_FORMS = {
  '\u0621': ['\uFE80', '\uFE80', '\uFE80', '\uFE80'], // ء
  '\u0622': ['\uFE81', '\uFE82', '\uFE81', '\uFE82'], // آ
  '\u0623': ['\uFE83', '\uFE84', '\uFE83', '\uFE84'], // أ
  '\u0624': ['\uFE85', '\uFE86', '\uFE85', '\uFE86'], // ؤ
  '\u0625': ['\uFE87', '\uFE88', '\uFE87', '\uFE88'], // إ
  '\u0626': ['\uFE89', '\uFE8A', '\uFE8B', '\uFE8C'], // ئ
  '\u0627': ['\uFE8D', '\uFE8E', '\uFE8D', '\uFE8E'], // ا
  '\u0628': ['\uFE8F', '\uFE90', '\uFE91', '\uFE92'], // ب
  '\u0629': ['\uFE93', '\uFE94', '\uFE93', '\uFE94'], // ة
  '\u062A': ['\uFE95', '\uFE96', '\uFE97', '\uFE98'], // ت
  '\u062B': ['\uFE99', '\uFE9A', '\uFE9B', '\uFE9C'], // ث
  '\u062C': ['\uFE9D', '\uFE9E', '\uFE9F', '\uFEA0'], // ج
  '\u062D': ['\uFEA1', '\uFEA2', '\uFEA3', '\uFEA4'], // ح
  '\u062E': ['\uFEA5', '\uFEA6', '\uFEA7', '\uFEA8'], // خ
  '\u062F': ['\uFEA9', '\uFEAA', '\uFEA9', '\uFEAA'], // د
  '\u0630': ['\uFEAB', '\uFEAC', '\uFEAB', '\uFEAC'], // ذ
  '\u0631': ['\uFEAD', '\uFEAE', '\uFEAD', '\uFEAE'], // ر
  '\u0632': ['\uFEAF', '\uFEB0', '\uFEAF', '\uFEB0'], // ز
  '\u0633': ['\uFEB1', '\uFEB2', '\uFEB3', '\uFEB4'], // س
  '\u0634': ['\uFEB5', '\uFEB6', '\uFEB7', '\uFEB8'], // ش
  '\u0635': ['\uFEB9', '\uFEBA', '\uFEBB', '\uFEBC'], // ص
  '\u0636': ['\uFEBD', '\uFEBE', '\uFEBF', '\uFEC0'], // ض
  '\u0637': ['\uFEC1', '\uFEC2', '\uFEC3', '\uFEC4'], // ط
  '\u0638': ['\uFEC5', '\uFEC6', '\uFEC7', '\uFEC8'], // ظ
  '\u0639': ['\uFEC9', '\uFECA', '\uFECB', '\uFECC'], // ع
  '\u063A': ['\uFECD', '\uFECE', '\uFECF', '\uFED0'], // غ
  '\u0641': ['\uFED1', '\uFED2', '\uFED3', '\uFED4'], // ف
  '\u0642': ['\uFED5', '\uFED6', '\uFED7', '\uFED8'], // ق
  '\u0643': ['\uFED9', '\uFEDA', '\uFEDB', '\uFEDC'], // ك
  '\u0644': ['\uFEDD', '\uFEDE', '\uFEDF', '\uFEE0'], // ل
  '\u0645': ['\uFEE1', '\uFEE2', '\uFEE3', '\uFEE4'], // م
  '\u0646': ['\uFEE5', '\uFEE6', '\uFEE7', '\uFEE8'], // ن
  '\u0647': ['\uFEE9', '\uFEEA', '\uFEEB', '\uFEEC'], // ه
  '\u0648': ['\uFEED', '\uFEEE', '\uFEED', '\uFEEE'], // و
  '\u0649': ['\uFEEF', '\uFEF0', '\uFEEF', '\uFEF0'], // ى
  '\u064A': ['\uFEF1', '\uFEF2', '\uFEF3', '\uFEF4'], // ي
  '\u0671': ['\uFB50', '\uFB51', '\uFB50', '\uFB51'], // ٱ
};

// Characters that do NOT connect to the letter that follows them (right-joining only)
const NON_CONNECTING = new Set([
  '\u0621', '\u0622', '\u0623', '\u0624', '\u0625', '\u0627',
  '\u0629', '\u062F', '\u0630', '\u0631', '\u0632', '\u0648',
  '\u0649', '\u0671',
]);

function isArabicChar(ch) {
  const cp = ch.charCodeAt(0);
  return (cp >= 0x0600 && cp <= 0x06FF) || (cp >= 0xFE70 && cp <= 0xFEFC);
}

/**
 * Reshape Arabic text into Presentation Forms and reverse for LTR rendering.
 * Handles mixed Arabic/Latin/number segments so numbers print correctly.
 */
function shapeArabic(text) {
  if (!text) return text;

  const chars = [...text];
  const n = chars.length;
  const shaped = new Array(n);

  for (let i = 0; i < n; i++) {
    const ch = chars[i];
    const forms = ARABIC_FORMS[ch];
    if (!forms) {
      shaped[i] = ch;
      continue;
    }

    const prevConnects = i > 0 && isArabicChar(chars[i - 1]) && !NON_CONNECTING.has(chars[i - 1]);
    const nextConnects = i < n - 1 && isArabicChar(chars[i + 1]);

    let formIdx;
    if (prevConnects && nextConnects) formIdx = 3; // medial
    else if (prevConnects && !nextConnects) formIdx = 1; // final
    else if (!prevConnects && nextConnects) formIdx = 2; // initial
    else formIdx = 0; // isolated

    shaped[i] = forms[formIdx];
  }

  return shaped.join('');
}

/**
 * Process text for RTL display - handles Arabic shaping and proper ordering
 */
function processArabicText(text) {
  if (!text) return '';

  const strText = String(text);

  // Check if contains Arabic
  if (!/[\u0600-\u06FF]/.test(strText)) {
    return strText;
  }

  // Shape the Arabic characters
  const shaped = shapeArabic(strText);

  // Split by spaces to handle words individually
  const words = shaped.split(' ');
  const processedWords = words.map(word => {
    // Check if the word contains Arabic/RTL characters
    const hasRTL = [...word].some(ch => {
      const cp = ch.charCodeAt(0);
      return (cp >= 0x0600 && cp <= 0x06FF) || (cp >= 0xFE70 && cp <= 0xFEFC);
    });

    // If it's an Arabic word, reverse its letters
    return hasRTL ? [...word].reverse().join('') : word;
  });

  // Reverse the order of the words for RTL display
  return processedWords.reverse().join(' ');
}
// ────────────────────────────────────────────────────────────────────────────

export async function generateInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Load Arabic Font
      const fontPath = path.join(process.cwd(), 'public', 'Amiri-Regular.ttf');
      let hasArabicFont = false;

      // Also try alternative font paths
      const alternativeFontPaths = [
        path.join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf'),
        path.join(process.cwd(), 'public', 'NotoSansArabic-Regular.ttf'),
      ];

      let loadedFontPath = null;
      if (fs.existsSync(fontPath)) {
        loadedFontPath = fontPath;
      } else {
        for (const altPath of alternativeFontPaths) {
          if (fs.existsSync(altPath)) {
            loadedFontPath = altPath;
            break;
          }
        }
      }

      if (loadedFontPath) {
        try {
          doc.registerFont('Amiri', loadedFontPath);
          hasArabicFont = true;
          console.log('✓ Arabic font loaded successfully:', loadedFontPath);
        } catch (err) {
          console.warn('Failed to register Arabic font:', err);
        }
      } else {
        console.warn('⚠ No Arabic font found at:', fontPath);
        console.warn('Please download Amiri font from: https://fonts.google.com/specimen/Amiri');
      }

      // Helper to draw text with proper Arabic handling
      const drawText = (text, x, y, options = {}) => {
        const strText = String(text || '');
        const containsArabic = /[\u0600-\u06FF]/.test(strText);

        // Set font based on content
        if (containsArabic && hasArabicFont) {
          doc.font('Amiri');
        } else if (options.bold) {
          doc.font('Helvetica-Bold');
        } else {
          doc.font('Helvetica');
        }

        // Set font size
        const fontSize = options.fontSize || 10;
        doc.fontSize(fontSize);

        let displayText = strText;
        if (containsArabic && hasArabicFont) {
          displayText = processArabicText(strText);
        }

        // Draw the text
        if (x !== undefined && y !== undefined) {
          doc.text(displayText, x, y, {
            ...options,
            align: options.align || 'left',
          });
        } else {
          doc.text(displayText, options);
        }
      };

      // --- Header ---
      doc.font('Helvetica-Bold').fontSize(20).text('INVOICE', 50, 50);

      // Store Info (Right Aligned)
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text('Mahally Store', 50, 50, { align: 'right' });
      doc.font('Helvetica').fontSize(10);
      doc.text('mahallystore.com', { align: 'right' });
      doc.text('Amman, Jordan', { align: 'right' });
      doc.moveDown();

      // --- Details ---
      const startY = doc.y + 10;
      doc.fontSize(10);

      // Draw order details with proper alignment
      const detailX = 50;
      let currentY = startY;

      doc.font('Helvetica');
      drawText(`Order #${order.id || order.number}`, detailX, currentY);
      currentY += 15;
      drawText(`Date: ${new Date(order.date_created).toLocaleDateString()}`, detailX, currentY);
      currentY += 15;
      drawText(`Status: ${order.status}`, detailX, currentY);
      currentY += 15;
      drawText(`Payment Method: ${order.payment_method_title || 'N/A'}`, detailX, currentY);
      currentY += 30;

      // --- Billing/Shipping ---
      const billingY = currentY;

      // Billing
      doc.font('Helvetica-Bold').fontSize(10);
      drawText('BILL TO', 50, billingY);
      doc.font('Helvetica');
      let billingYOffset = billingY + 15;

      const billingName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim();
      if (billingName) {
        drawText(billingName, 50, billingYOffset);
        billingYOffset += 15;
      }
      if (order.billing?.address_1) {
        drawText(order.billing.address_1, 50, billingYOffset);
        billingYOffset += 15;
      }
      const cityCountry = `${order.billing?.city || ''}${order.billing?.city && order.billing?.country ? ', ' : ''}${order.billing?.country || ''}`;
      if (cityCountry) {
        drawText(cityCountry, 50, billingYOffset);
        billingYOffset += 15;
      }
      if (order.billing?.email) {
        drawText(order.billing.email, 50, billingYOffset);
        billingYOffset += 15;
      }
      if (order.billing?.phone) {
        drawText(order.billing.phone, 50, billingYOffset);
        billingYOffset += 15;
      }

      // Shipping (if available)
      if (order.shipping && order.shipping.first_name) {
        doc.font('Helvetica-Bold').fontSize(10);
        drawText('SHIP TO', 300, billingY);
        doc.font('Helvetica');
        let shippingYOffset = billingY + 15;

        const shippingName = `${order.shipping.first_name || ''} ${order.shipping.last_name || ''}`.trim();
        if (shippingName) {
          drawText(shippingName, 300, shippingYOffset);
          shippingYOffset += 15;
        }
        if (order.shipping.address_1) {
          drawText(order.shipping.address_1, 300, shippingYOffset);
          shippingYOffset += 15;
        }
        const shippingCityCountry = `${order.shipping.city || ''}${order.shipping.city && order.shipping.country ? ', ' : ''}${order.shipping.country || ''}`;
        if (shippingCityCountry) {
          drawText(shippingCityCountry, 300, shippingYOffset);
          shippingYOffset += 15;
        }
      }

      doc.moveDown(2);

      // --- Items Table ---
      const tableTop = doc.y + 20;
      doc.moveTo(50, tableTop - 10).lineTo(550, tableTop - 10).stroke();

      // Table Header
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Item', 50, tableTop);
      doc.text('Product No.', 250, tableTop);
      doc.text('Qty', 380, tableTop);
      doc.text('Price', 430, tableTop);
      doc.text('Total', 490, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let itemY = tableTop + 25;

      // --- Items Data ---
      (order.line_items || []).forEach((item, index) => {
        if (itemY > 700) {
          doc.addPage();
          itemY = 50;
        }

        // Item name (handle Arabic)
        const itemName = item.name || 'Product';
        drawText(itemName, 50, itemY, { width: 190 });

        // Product Number
        const productNo = getProductIdentifier(item);
        doc.font('Helvetica').fontSize(10);
        doc.text(String(productNo), 250, itemY, { width: 120 });

        // Quantity, Price, Total
        doc.text(String(item.quantity || 1), 380, itemY);
        doc.text(`JOD ${parseFloat(item.price || 0).toFixed(2)}`, 430, itemY);
        doc.text(`JOD ${parseFloat(item.total || (item.price * item.quantity) || 0).toFixed(2)}`, 490, itemY);

        itemY += 25;
      });

      // Table bottom line
      doc.moveTo(50, itemY).lineTo(550, itemY).stroke();

      // --- Totals ---
      itemY += 15;
      const totalsX = 380;

      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal:', totalsX, itemY);
      doc.text(`JOD ${parseFloat(order.total || 0).toFixed(2)}`, 490, itemY);
      itemY += 15;

      const shippingTotal = parseFloat(order.shipping_total || 0);
      if (shippingTotal > 0) {
        doc.text('Shipping:', totalsX, itemY);
        doc.text(`JOD ${shippingTotal.toFixed(2)}`, 490, itemY);
        itemY += 15;
      } else {
        doc.text('Shipping:', totalsX, itemY);
        doc.text('Free', 490, itemY);
        itemY += 15;
      }

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Grand Total:', totalsX, itemY);
      doc.text(`JOD ${parseFloat(order.total || 0).toFixed(2)}`, 490, itemY);

      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
}
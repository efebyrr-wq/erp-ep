import { useState, useEffect, useRef } from 'react';
import { Tabs } from '../components/common/Tabs';
import { DateInput } from '../components/common/DateInput';
import { apiGet } from '../lib/api';
import { convertYYYYMMDDToDDMMYYYY } from '../lib/dateUtils';
import type { Customer } from '../types';
import styles from './PdfGenerationPage.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type PdfType = 'pricing-offer' | 'invoice';

type InvoiceItem = {
  description: string;
  price: string;
  quantity: string;
  amount: string;
};

type BankAccount = {
  bank: string;
  accountHolder: string;
  branch: string;
  accountNumber: string;
  iban: string;
};

export default function PdfGenerationPage() {
  const [activeTab, setActiveTab] = useState<PdfType>('invoice');
  const [loading, setLoading] = useState(false);

  // Pricing Offer Form
  const [pricingOfferForm, setPricingOfferForm] = useState({
    from: {
      name: 'EFELER PLATFORM VİNÇ İNŞ. LTD. ŞTİ.',
      address: 'KANAL MAH. 4699 SOK ŞABAN BAYAR APT NO:9 KAT: 1',
      city: 'KEPEZ/ ANTALYA',
      phone1: '05325067767',
      phone2: '',
      website: '',
      email: 'efelerplatform@gmail.com',
      vergiDairesi: 'KURUMLAR',
      vkn: '3251168019',
      logo: '',
    },
    to: {
      name: '',
      address: '',
      phone: '',
      email: '',
      vergiDairesi: '',
      vkn: '',
    },
    offerNumber: '',
    date: convertYYYYMMDDToDDMMYYYY(new Date().toISOString().split('T')[0]),
    validUntil: '',
    items: [
      {
        description: '',
        price: '',
        quantity: '',
        amount: '',
      },
    ],
    notes: '',
    tax: {
      type: 'percent' as 'percent' | 'fixed',
      value: '20',
      enabled: true,
    },
    discount: {
      type: 'percent' as 'percent' | 'fixed',
      value: '',
      enabled: true,
    },
    shipping: {
      value: '',
      enabled: false,
    },
    subtotal: '0.00',
    balanceDue: '0.00',
  });

  // Customers for dropdown
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    type: 'invoice',
    from: {
      name: 'EFELER PLATFORM VİNÇ İNŞ. LTD. ŞTİ.',
      address: 'KANAL MAH. 4699 SOK ŞABAN BAYAR APT NO:9 KAT: 1',
      city: 'KEPEZ/ ANTALYA',
      phone1: '05325067767',
      phone2: '',
      website: '',
      email: 'efelerplatform@gmail.com',
      vergiDairesi: 'KURUMLAR',
      vkn: '3251168019',
      logo: '',
    },
    to: {
      name: '',
      address: '',
      phone: '',
      email: '',
      vergiDairesi: '',
      vkn: '',
    },
    invoiceNumber: '',
    terms: 'Due On Receipt',
    date: convertYYYYMMDDToDDMMYYYY(new Date().toISOString().split('T')[0]),
    dueDate: '',
    items: [
      {
        description: '',
        price: '',
        quantity: '',
        amount: '',
      },
    ],
    notes: '',
    tax: {
      type: 'percent' as 'percent' | 'fixed',
      value: '20',
      enabled: true,
    },
    discount: {
      type: 'percent' as 'percent' | 'fixed',
      value: '',
      enabled: true,
    },
    shipping: {
      value: '',
      enabled: false,
    },
    bankAccounts: [] as BankAccount[],
    subtotal: '0.00',
    balanceDue: '0.00',
  });

  const pricingOfferFormRef = useRef<HTMLFormElement>(null);
  const invoiceFormRef = useRef<HTMLFormElement>(null);

  const generatePdf = async (type: PdfType, preview: boolean = false) => {
    setLoading(true);
    try {
      // Find the active form element based on type
      let formElement: HTMLFormElement | null = null;
      if (type === 'pricing-offer') {
        formElement = pricingOfferFormRef.current;
      } else if (type === 'invoice') {
        formElement = invoiceFormRef.current;
      }
      
      if (!formElement) {
        throw new Error('Form element not found');
      }

      // Hide buttons before capturing PDF
      const buttonsToHide = [
        'button[class*="newItemButton"]', // Yeni Öğe buttons
        'button[class*="removeItemButton"]', // Item silme buttons (ikinci satırdan başlayan)
        'button[class*="removeTaxDiscountButton"]', // Vergi/İndirim çöp kutusu ikonları
        'button[aria-label="Open date picker"]', // Hide calendar icons
        'button[aria-label="Open date picker"] svg', // Hide calendar icon SVGs
        '.topRightDates button', // Hide all buttons in date area (calendar icons)
        '.topRightDates svg', // Hide all SVGs in date area (calendar icons)
      ];
      
      const hiddenElements: Array<{ element: HTMLElement; originalDisplay: string }> = [];
      
      buttonsToHide.forEach((selector) => {
        const elements = formElement.querySelectorAll(selector);
        elements.forEach((element) => {
          const htmlElement = element as HTMLElement;
          hiddenElements.push({
            element: htmlElement,
            originalDisplay: htmlElement.style.display || '',
          });
          htmlElement.style.display = 'none';
        });
      });

      // Convert textareas to divs to preserve newlines in PDF
      const textareas = formElement.querySelectorAll('textarea');
      const textareaReplacements: Array<{ textarea: HTMLTextAreaElement; replacement: HTMLDivElement }> = [];
      
      textareas.forEach((textarea) => {
        const div = document.createElement('div');
        div.textContent = textarea.value;
        div.style.cssText = window.getComputedStyle(textarea).cssText;
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.overflow = 'hidden';
        div.style.height = textarea.offsetHeight + 'px';
        div.style.minHeight = textarea.style.minHeight || '100px';
        div.style.maxHeight = textarea.style.maxHeight || '300px';
        div.style.resize = 'none';
        div.style.padding = window.getComputedStyle(textarea).padding;
        div.style.border = window.getComputedStyle(textarea).border;
        div.style.borderRadius = window.getComputedStyle(textarea).borderRadius;
        div.style.fontSize = window.getComputedStyle(textarea).fontSize;
        div.style.fontFamily = window.getComputedStyle(textarea).fontFamily;
        div.style.backgroundColor = window.getComputedStyle(textarea).backgroundColor;
        div.style.color = window.getComputedStyle(textarea).color;
        div.style.width = textarea.offsetWidth + 'px';
        div.style.boxSizing = 'border-box';
        
        textarea.parentNode?.insertBefore(div, textarea);
        textarea.style.display = 'none';
        textareaReplacements.push({ textarea, replacement: div });
      });

      // Wait for all images to load before capturing
      const images = formElement.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn('Image failed to load:', img.src);
              resolve(); // Continue even if image fails
            };
            // Timeout after 5 seconds
            setTimeout(() => resolve(), 5000);
          });
        })
      );

      // Capture the form as canvas with high quality
      const scale = 2; // Higher scale for better quality
      const canvas = await html2canvas(formElement, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: formElement.scrollWidth,
        height: formElement.scrollHeight,
        imageTimeout: 15000, // 15 second timeout for images
        removeContainer: false,
      });

      // A4 dimensions in mm
      const a4Width = 210; // A4 width in mm
      const a4Height = 297; // A4 height in mm

      // Get form dimensions in pixels (actual rendered size)
      const formWidthPx = formElement.scrollWidth;
      const formHeightPx = formElement.scrollHeight;

      // Convert pixels to mm (at 96 DPI: 1mm = 96/25.4 pixels ≈ 3.779527559 pixels)
      const pixelsPerMm = 96 / 25.4;
      const formWidthMm = formWidthPx / pixelsPerMm;
      const formHeightMm = formHeightPx / pixelsPerMm;

      // Since form is set to 210mm width, scale factor should be 1.0
      // This ensures 1:1 matching between form and PDF
      const scaleFactor = a4Width / formWidthMm; // Should be ~1.0

      // Create PDF in A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate scaled height (maintaining aspect ratio)
      const scaledHeightMm = formHeightMm * scaleFactor;

      // Calculate number of pages needed
      const pagesNeeded = Math.ceil(scaledHeightMm / a4Height);

      // Add image to PDF, splitting across pages if needed
      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate the portion of the canvas to show on this page
        // Convert A4 height to pixels, accounting for canvas scale
        const pageHeightPx = (a4Height / scaleFactor) * pixelsPerMm * scale;
        const sourceY = i * pageHeightPx;
        const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

        // Create a temporary canvas for this page portion
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          // Draw the portion of the original canvas onto the page canvas
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          // Validate canvas before converting to data URL
          if (pageCanvas.width === 0 || pageCanvas.height === 0) {
            console.warn(`Skipping empty page canvas at index ${i}`);
            continue;
          }
          
          let pageImgData: string;
          try {
            pageImgData = pageCanvas.toDataURL('image/png', 1.0);
            
            // Validate the data URL
            if (!pageImgData || pageImgData === 'data:,') {
              console.warn(`Invalid data URL for page ${i}, skipping`);
              continue;
            }
          } catch (error) {
            console.error(`Error converting canvas to data URL for page ${i}:`, error);
            continue;
          }
          
          // Calculate display height in mm for this page (accounting for canvas scale)
          const displayHeightMm = (sourceHeight / scale) / pixelsPerMm * scaleFactor;
          
          // Add image at exact A4 width (210mm), preserving all relative spacing
          try {
            pdf.addImage(pageImgData, 'PNG', 0, 0, a4Width, displayHeightMm);
          } catch (error) {
            console.error(`Error adding image to PDF for page ${i}:`, error);
            // Try with JPEG as fallback
            try {
              const jpegData = pageCanvas.toDataURL('image/jpeg', 0.95);
              pdf.addImage(jpegData, 'JPEG', 0, 0, a4Width, displayHeightMm);
            } catch (jpegError) {
              console.error(`Error adding JPEG fallback for page ${i}:`, jpegError);
            }
          }
        }
      }

      // Restore all hidden buttons after capturing
      hiddenElements.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay || '';
      });

      // Restore textareas and remove replacement divs
      textareaReplacements.forEach(({ textarea, replacement }) => {
        textarea.style.display = '';
        replacement.remove();
      });

      if (preview) {
        // Open PDF in new window for preview
        const pdfBlob = pdf.output('blob');
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        // Clean up after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        // Download PDF
        pdf.save(`${type}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const addPricingOfferItem = () => {
    setPricingOfferForm((prev) => {
      const newItems = [...prev.items, { description: '', price: '', quantity: '', amount: '' }];
      const newForm = { ...prev, items: newItems };
      const { subtotal, balanceDue } = calculateBalanceDueForPricingOffer(newForm);
      return { ...newForm, subtotal, balanceDue };
    });
  };

  const updatePricingOfferItem = (index: number, field: keyof InvoiceItem, value: string) => {
    setPricingOfferForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-calculate amount when price or quantity changes
      if (field === 'price' || field === 'quantity') {
        const price = parseFloat(newItems[index].price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const quantity = parseFloat(newItems[index].quantity) || 0;
        const amount = (price * quantity).toFixed(2);
        newItems[index].amount = amount;
      }
      
      // Recalculate subtotal and balance due
      const newForm = { ...prev, items: newItems };
      const { subtotal, balanceDue } = calculateBalanceDueForPricingOffer(newForm);
      
      return {
        ...newForm,
        subtotal,
        balanceDue,
      };
    });
  };

  const removePricingOfferItem = (index: number) => {
    setPricingOfferForm((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const newForm = { ...prev, items: newItems };
      const { subtotal, balanceDue } = calculateBalanceDueForPricingOffer(newForm);
      return { ...newForm, subtotal, balanceDue };
    });
  };

  // Removed updatePricingOfferTax and updatePricingOfferDiscount - not used (tax/discount removed from pricing offer form)

  const addInvoiceItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', price: '', quantity: '', amount: '' }],
    }));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string) => {
    setInvoiceForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-calculate amount when price or quantity changes
      if (field === 'price' || field === 'quantity') {
        const price = parseFloat(newItems[index].price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const quantity = parseFloat(newItems[index].quantity) || 0;
        const amount = (price * quantity).toFixed(2);
        newItems[index].amount = amount;
      }
      
      // Recalculate subtotal and balance due using shared function
      const newForm = { ...prev, items: newItems };
      const { subtotal, balanceDue } = calculateBalanceDue(newForm);
      
      return {
        ...newForm,
        subtotal,
        balanceDue,
      };
    });
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceForm((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      
      // Recalculate subtotal and balance due using shared function
      const newForm = { ...prev, items: newItems };
      const { subtotal, balanceDue } = calculateBalanceDue(newForm);
      
      return {
        ...newForm,
        subtotal,
        balanceDue,
      };
    });
  };

  // Bank account functions - reserved for future use
  // const addBankAccount = () => {
  //   setInvoiceForm((prev) => ({
  //     ...prev,
  //     bankAccounts: [
  //       ...prev.bankAccounts,
  //       { bank: '', accountHolder: '', branch: '', accountNumber: '', iban: '' },
  //     ],
  //   }));
  // };

  // const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
  //   setInvoiceForm((prev) => {
  //     const newAccounts = [...prev.bankAccounts];
  //     newAccounts[index] = { ...newAccounts[index], [field]: value };
  //     return { ...prev, bankAccounts: newAccounts };
  //   });
  // };

  const calculateBalanceDue = (form: typeof invoiceForm) => {
    // Recalculate subtotal from items
    const subtotal = form.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
    
    let taxAmount = 0;
    if (form.tax.enabled && form.tax.value) {
      const taxValue = parseFloat(form.tax.value) || 0;
      if (form.tax.type === 'percent') {
        taxAmount = (subtotal * taxValue) / 100;
      } else {
        taxAmount = taxValue;
      }
    }
    
    let discountAmount = 0;
    if (form.discount.enabled && form.discount.value) {
      const discountValue = parseFloat(form.discount.value) || 0;
      if (form.discount.type === 'percent') {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }
    
    const shippingAmount = form.shipping.enabled ? (parseFloat(form.shipping.value) || 0) : 0;
    
    return {
      subtotal: subtotal.toFixed(2),
      balanceDue: (subtotal + taxAmount - discountAmount + shippingAmount).toFixed(2),
    };
  };

  const calculateBalanceDueForPricingOffer = (form: typeof pricingOfferForm) => {
    // Recalculate subtotal from items
    const subtotal = form.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
    
    let taxAmount = 0;
    if (form.tax.enabled && form.tax.value) {
      const taxValue = parseFloat(form.tax.value) || 0;
      if (form.tax.type === 'percent') {
        taxAmount = (subtotal * taxValue) / 100;
      } else {
        taxAmount = taxValue;
      }
    }
    
    let discountAmount = 0;
    if (form.discount.enabled && form.discount.value) {
      const discountValue = parseFloat(form.discount.value) || 0;
      if (form.discount.type === 'percent') {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }
    
    const shippingAmount = form.shipping.enabled ? (parseFloat(form.shipping.value) || 0) : 0;
    
    return {
      subtotal: subtotal.toFixed(2),
      balanceDue: (subtotal + taxAmount - discountAmount + shippingAmount).toFixed(2),
    };
  };

  const updateTax = (field: 'type' | 'value' | 'enabled', value: string | boolean) => {
    setInvoiceForm((prev) => {
      const newTax = { ...prev.tax, [field]: value };
      const newForm = { ...prev, tax: newTax };
      const { subtotal, balanceDue } = calculateBalanceDue(newForm);
      return { ...newForm, subtotal, balanceDue };
    });
  };

  const updateDiscount = (field: 'type' | 'value' | 'enabled', value: string | boolean) => {
    setInvoiceForm((prev) => {
      const newDiscount = { ...prev.discount, [field]: value };
      const newForm = { ...prev, discount: newDiscount };
      const { subtotal, balanceDue } = calculateBalanceDue(newForm);
      return { ...newForm, subtotal, balanceDue };
    });
  };

  // Shipping update function - reserved for future use
  // const updateShipping = (field: 'value' | 'enabled', value: string | boolean) => {
  //   setInvoiceForm((prev) => {
  //     const newShipping = { ...prev.shipping, [field]: value };
  //     const newForm = { ...prev, shipping: newShipping };
  //     const { subtotal, balanceDue } = calculateBalanceDue(newForm);
  //     return { ...newForm, subtotal, balanceDue };
  //   });
  // };

  // Fetch customers on component mount
  useEffect(() => {
    void apiGet<Customer[]>('/customers', []).then((data) => {
      setCustomers(data);
    });
  }, []);

  // Handle customer selection for invoice
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setInvoiceForm((prev) => ({
        ...prev,
        to: {
          name: customer.name || '',
          address: customer.address || '',
          phone: customer.phoneNumber || '',
          email: customer.email || '',
          vergiDairesi: customer.vergiDairesi || '',
          vkn: customer.vkn || '',
        },
      }));
    }
  };

  // Handle customer selection for pricing offer
  const [selectedPricingOfferCustomerId, setSelectedPricingOfferCustomerId] = useState<string>('');
  const handlePricingOfferCustomerSelect = (customerId: string) => {
    setSelectedPricingOfferCustomerId(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setPricingOfferForm((prev) => ({
        ...prev,
        to: {
          name: customer.name || '',
          address: customer.address || '',
          phone: customer.phoneNumber || '',
          email: customer.email || '',
          vergiDairesi: customer.vergiDairesi || '',
          vkn: customer.vkn || '',
        },
      }));
    }
  };

  const handlePreviewPdf = async () => {
    await generatePdf(activeTab, true);
  };

  const handleGeneratePdf = async () => {
    await generatePdf(activeTab, false);
  };

  return (
    <div className={styles.page}>
      <Tabs
        tabs={[
          { id: 'pricing-offer', label: 'Fiyat Teklifi' },
          { id: 'invoice', label: 'Irsaliye' },
        ]}
        active={activeTab}
        onChange={(tab) => setActiveTab(tab as PdfType)}
        actions={
          <div className={styles.tabActions}>
            <button
              type="button"
              className={styles.previewButton}
              onClick={handlePreviewPdf}
              disabled={loading}
            >
              {loading ? 'Önizleme Oluşturuluyor...' : 'PDF Önizle'}
            </button>
            <button
              type="button"
              className={styles.generateButton}
              onClick={handleGeneratePdf}
              disabled={loading}
            >
              {loading ? 'Oluşturuluyor...' : 'PDF Oluştur'}
            </button>
          </div>
        }
      >

      {/* Pricing Offer Form */}
      {activeTab === 'pricing-offer' && (
        <form ref={pricingOfferFormRef} className={styles.modernForm} onSubmit={(e) => { e.preventDefault(); }}>
          <div className={styles.formContainer}>
            {/* FROM/TO and Logo Section */}
            <div className={styles.fromToLogoSection}>
              {/* Date Fields at Top Right */}
              <div className={styles.topRightDates}>
                <div className={styles.dateField}>
                  <label className={styles.dateLabel}>Tarih</label>
                    <DateInput
                    value={pricingOfferForm.date}
                    onChange={(value) =>
                      setPricingOfferForm((prev) => ({ ...prev, date: value }))
                    }
                    required
                  />
                </div>
                <div className={styles.dateField}>
                  <label className={styles.dateLabel}>Geçerlilik Tarihi</label>
                  <DateInput
                    value={pricingOfferForm.validUntil || ''}
                    onChange={(value) =>
                      setPricingOfferForm((prev) => ({ ...prev, validUntil: value }))
                    }
                  />
                </div>
              </div>
              <div className={styles.fromToContainer}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxHeader}>Gönderen</div>
                  <div className={styles.infoBoxContent}>
                    <div className={styles.infoBoxLine}>{pricingOfferForm.from.name}</div>
                    <div className={styles.infoBoxLine}>{pricingOfferForm.from.address}</div>
                    <div className={styles.infoBoxLine}>{pricingOfferForm.from.city}</div>
                    <div className={styles.infoBoxLine}>
                      Tel1: {pricingOfferForm.from.phone1} {pricingOfferForm.from.phone2 && `Tel2: ${pricingOfferForm.from.phone2}`}
                    </div>
                    {pricingOfferForm.from.website && (
                      <div className={styles.infoBoxLine}>Web Site: {pricingOfferForm.from.website}</div>
                    )}
                    <div className={styles.infoBoxLine}>E-Posta: {pricingOfferForm.from.email}</div>
                    <div className={styles.infoBoxLine}>
                      Vergi Dairesi: {pricingOfferForm.from.vergiDairesi}
                    </div>
                    <div className={styles.infoBoxLine}>VKN: {pricingOfferForm.from.vkn}</div>
                  </div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxHeader}>Alıcı</div>
                  <select
                    className={styles.infoBoxSelect}
                    value={selectedPricingOfferCustomerId}
                    onChange={(e) => handlePricingOfferCustomerSelect(e.target.value)}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {selectedPricingOfferCustomerId && (
                    <div className={styles.infoBoxContent}>
                      {pricingOfferForm.to.name && (
                        <div className={styles.infoBoxLine}>{pricingOfferForm.to.name}</div>
                      )}
                      {pricingOfferForm.to.address && (
                        <div className={styles.infoBoxLine}>{pricingOfferForm.to.address}</div>
                      )}
                      {pricingOfferForm.to.phone && (
                        <div className={styles.infoBoxLine}>Tel: {pricingOfferForm.to.phone}</div>
                      )}
                      {pricingOfferForm.to.email && (
                        <div className={styles.infoBoxLine}>E-Posta: {pricingOfferForm.to.email}</div>
                      )}
                      {pricingOfferForm.to.vergiDairesi && (
                        <div className={styles.infoBoxLine}>
                          Vergi Dairesi: {pricingOfferForm.to.vergiDairesi}
                        </div>
                      )}
                      {pricingOfferForm.to.vkn && (
                        <div className={styles.infoBoxLine}>VKN: {pricingOfferForm.to.vkn}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.middleLogoArea}>
                <img 
                  src="/fiyat-teklifi-logo.png" 
                  alt="Fiyat Teklifi" 
                  className={styles.middleLogoImage}
                />
              </div>
              <div className={styles.logoColumn}>
                <div className={styles.logoArea}>
                  <img 
                    src="/efeler-platform-logo.png" 
                    alt="EFELER PLATFORM" 
                    className={styles.logoImage}
                  />
                </div>
              </div>
            </div>

          {/* Main Content Area */}
          <div className={styles.mainContent}>
            {/* Left Column - Items and Notes */}
            <div className={styles.leftColumn}>
              {/* Items Section */}
              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <div className={styles.itemsHeaderRow}>
                    <div className={styles.headerCell}>Açıklama</div>
                    <div className={styles.headerCell}>Fiyat</div>
                    <div className={styles.headerCell}>Miktar</div>
                    <div className={styles.headerCell}>Tutar</div>
                  </div>
                </div>
                <div className={styles.itemsBody}>
                  {pricingOfferForm.items.map((item, index) => (
                    <div key={index} className={styles.itemRow}>
                      <div className={styles.itemDescription}>
                        <input
                          className={styles.itemInput}
                          placeholder="Açıklama"
                          value={item.description}
                          onChange={(e) => updatePricingOfferItem(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.itemPrice}>
                        <div className={styles.priceInputWrapper}>
                          <span className={styles.currencySymbol}>₺</span>
                          <input
                            className={styles.itemInput}
                            type="text"
                            placeholder="0.00"
                            value={item.price}
                            onChange={(e) => updatePricingOfferItem(index, 'price', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.itemQuantity}>
                        <input
                          className={styles.itemInput}
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => updatePricingOfferItem(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className={styles.itemAmountWrapper}>
                        <div className={styles.itemAmount}>
                          ₺{parseFloat(item.amount || '0').toFixed(2)}
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removePricingOfferItem(index)}
                            className={styles.removeItemButton}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.itemsFooter}>
                  <button type="button" onClick={addPricingOfferItem} className={styles.newItemButton}>
                    + Yeni Öğe
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              <div className={styles.notesSection}>
                <label>
                  <span>Ekstra Notlar</span>
                  <textarea
                    value={pricingOfferForm.notes}
                    onChange={(e) =>
                      setPricingOfferForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={4}
                    placeholder="Add any additional notes or comments..."
                  />
                </label>
              </div>

            </div>
          </div>
          </div>

        </form>
      )}

      {/* Invoice Form */}
      {activeTab === 'invoice' && (
        <form ref={invoiceFormRef} className={styles.modernForm} onSubmit={(e) => { e.preventDefault(); }}>
          <div className={styles.formContainer}>
            {/* FROM/TO and Logo Section */}
            <div className={styles.fromToLogoSection}>
              {/* Date Fields at Top Right */}
              <div className={styles.topRightDates}>
                <div className={styles.dateField}>
                  <label className={styles.dateLabel}>Tarih</label>
                  <DateInput
                    value={invoiceForm.date}
                    onChange={(value) =>
                      setInvoiceForm((prev) => ({ ...prev, date: value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className={styles.fromToContainer}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxHeader}>Gönderen</div>
                  <div className={styles.infoBoxContent}>
                    <div className={styles.infoBoxLine}>{invoiceForm.from.name}</div>
                    <div className={styles.infoBoxLine}>{invoiceForm.from.address}</div>
                    <div className={styles.infoBoxLine}>{invoiceForm.from.city}</div>
                    <div className={styles.infoBoxLine}>
                      Tel1: {invoiceForm.from.phone1} {invoiceForm.from.phone2 && `Tel2: ${invoiceForm.from.phone2}`}
                    </div>
                    {invoiceForm.from.website && (
                      <div className={styles.infoBoxLine}>Web Site: {invoiceForm.from.website}</div>
                    )}
                    <div className={styles.infoBoxLine}>E-Posta: {invoiceForm.from.email}</div>
                    <div className={styles.infoBoxLine}>
                      Vergi Dairesi: {invoiceForm.from.vergiDairesi}
                    </div>
                    <div className={styles.infoBoxLine}>VKN: {invoiceForm.from.vkn}</div>
                  </div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxHeader}>Alıcı</div>
                  <select
                    className={styles.infoBoxSelect}
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {selectedCustomerId && (
                    <div className={styles.infoBoxContent}>
                      {invoiceForm.to.name && (
                        <div className={styles.infoBoxLine}>{invoiceForm.to.name}</div>
                      )}
                      {invoiceForm.to.address && (
                        <div className={styles.infoBoxLine}>{invoiceForm.to.address}</div>
                      )}
                      {invoiceForm.to.phone && (
                        <div className={styles.infoBoxLine}>Tel: {invoiceForm.to.phone}</div>
                      )}
                      {invoiceForm.to.email && (
                        <div className={styles.infoBoxLine}>E-Posta: {invoiceForm.to.email}</div>
                      )}
                      {invoiceForm.to.vergiDairesi && (
                        <div className={styles.infoBoxLine}>
                          Vergi Dairesi: {invoiceForm.to.vergiDairesi}
                        </div>
                      )}
                      {invoiceForm.to.vkn && (
                        <div className={styles.infoBoxLine}>VKN: {invoiceForm.to.vkn}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.middleLogoArea}>
                <img 
                  src="/invoice-middle-logo.png" 
                  alt="Invoice Logo" 
                  className={styles.middleLogoImage}
                />
              </div>
              <div className={styles.logoColumn}>
                <div className={styles.logoArea}>
                  <img 
                    src="/efeler-platform-logo.png" 
                    alt="EFELER PLATFORM" 
                    className={styles.logoImage}
                  />
                </div>
                {/* Balance Due under Logo */}
                <div className={styles.balanceDueUnderLogo}>
                  <span className={styles.balanceDueLabel}>Ödenecek Tutar</span>
                  <span className={styles.balanceDueValue}>₺{invoiceForm.balanceDue}</span>
                </div>
              </div>
            </div>

          {/* Main Content Area - Two Column Layout */}
          <div className={styles.mainContent}>
            {/* Left Column - Items and Notes */}
            <div className={styles.leftColumn}>
              {/* Items Section */}
              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <div className={styles.itemsHeaderRow}>
                    <div className={styles.headerCell}>Açıklama</div>
                    <div className={styles.headerCell}>Fiyat</div>
                    <div className={styles.headerCell}>Miktar</div>
                    <div className={styles.headerCell}>Tutar</div>
                  </div>
                </div>
                <div className={styles.itemsBody}>
                  {invoiceForm.items.map((item, index) => (
                    <div key={index} className={styles.itemRow}>
                      <div className={styles.itemDescription}>
                        <input
                          className={styles.itemInput}
                          placeholder="Açıklama"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.itemPrice}>
                        <div className={styles.priceInputWrapper}>
                          <span className={styles.currencySymbol}>₺</span>
                          <input
                            className={styles.itemInput}
                            type="text"
                            placeholder="0.00"
                            value={item.price}
                            onChange={(e) => updateInvoiceItem(index, 'price', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.itemQuantity}>
                        <input
                          className={styles.itemInput}
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className={styles.itemAmountWrapper}>
                        <div className={styles.itemAmount}>
                          ₺{parseFloat(item.amount || '0').toFixed(2)}
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(index)}
                            className={styles.removeItemButton}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.itemsFooter}>
                  <button type="button" onClick={addInvoiceItem} className={styles.newItemButton}>
                    + Yeni Öğe
                  </button>
                </div>
              </div>

              {/* Notes and Tax/Discount Section - Same Row */}
              <div className={styles.notesAndTaxRow}>
                {/* Notes Section */}
                <div className={styles.notesSection}>
                  <label>
                    <span>Ekstra Notlar</span>
                    <textarea
                      value={invoiceForm.notes}
                      onChange={(e) =>
                        setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      rows={4}
                      placeholder="Add any additional notes or comments..."
                    />
                  </label>
                </div>

                {/* Tax and Discount Section */}
                <div className={styles.financialSummary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Ara Toplam</span>
                    <span className={styles.summaryValue}>₺{invoiceForm.subtotal}</span>
                  </div>
                  
                  {invoiceForm.tax.enabled && (
                    <div className={styles.taxDiscountRow}>
                      <div className={styles.taxDiscountButtons}>
                        <button
                          type="button"
                          className={`${styles.taxDiscountToggle} ${invoiceForm.tax.type === 'percent' ? styles.active : ''}`}
                          onClick={() => updateTax('type', 'percent')}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          className={`${styles.taxDiscountToggle} ${invoiceForm.tax.type === 'fixed' ? styles.active : ''}`}
                          onClick={() => updateTax('type', 'fixed')}
                        >
                          ₺
                        </button>
                      </div>
                      <span className={styles.summaryLabel}>Vergi</span>
                      <button
                        type="button"
                        className={styles.removeTaxDiscountButton}
                        onClick={() => updateTax('enabled', false)}
                      >
                        🗑️
                      </button>
                      <div className={styles.taxDiscountInput}>
                        <input
                          type="number"
                          value={invoiceForm.tax.value}
                          onChange={(e) => updateTax('value', e.target.value)}
                          placeholder="0"
                          step="0.01"
                        />
                        <span className={styles.taxDiscountSymbol}>{invoiceForm.tax.type === 'percent' ? '%' : '₺'}</span>
                      </div>
                    </div>
                  )}
                  
                  {!invoiceForm.tax.enabled && (
                    <button
                      type="button"
                      className={styles.addTaxButton}
                      onClick={() => updateTax('enabled', true)}
                    >
                      + Vergi
                    </button>
                  )}

                  {invoiceForm.discount.enabled && (
                    <div className={styles.taxDiscountRow}>
                      <div className={styles.taxDiscountButtons}>
                        <button
                          type="button"
                          className={`${styles.taxDiscountToggle} ${invoiceForm.discount.type === 'percent' ? styles.active : ''}`}
                          onClick={() => updateDiscount('type', 'percent')}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          className={`${styles.taxDiscountToggle} ${invoiceForm.discount.type === 'fixed' ? styles.active : ''}`}
                          onClick={() => updateDiscount('type', 'fixed')}
                        >
                          ₺
                        </button>
                      </div>
                      <span className={styles.summaryLabel}>İndirim</span>
                      <button
                        type="button"
                        className={styles.removeTaxDiscountButton}
                        onClick={() => updateDiscount('enabled', false)}
                      >
                        🗑️
                      </button>
                      <div className={styles.taxDiscountInput}>
                        <input
                          type="number"
                          value={invoiceForm.discount.value}
                          onChange={(e) => updateDiscount('value', e.target.value)}
                          placeholder="0"
                          step="0.01"
                        />
                        <span className={styles.taxDiscountSymbol}>{invoiceForm.discount.type === 'percent' ? '%' : '₺'}</span>
                      </div>
                    </div>
                  )}
                  
                  {!invoiceForm.discount.enabled && (
                    <button
                      type="button"
                      className={styles.addDiscountButton}
                      onClick={() => updateDiscount('enabled', true)}
                    >
                      + İndirim
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
          </div>

        </form>
      )}
      </Tabs>
    </div>
  );
}


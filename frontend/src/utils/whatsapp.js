/**
 * Utilidades para integración con WhatsApp via Direct Links
 */

/**
 * Genera un link de WhatsApp wa.me
 * @param {string} phone - Número de teléfono
 * @param {string} message - Mensaje pre-formateado
 * @returns {string|null} - URL de WhatsApp o null si no hay teléfono
 */
export const getWhatsAppLink = (phone, message) => {
    if (!phone) return null;
    
    // Limpiar caracteres no numéricos
    let cleanPhone = phone.toString().replace(/\D/g, '');
    
    // Si el número tiene 10 dígitos (Colombia) y no tiene el 57, agregarlo
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) {
        cleanPhone = '57' + cleanPhone;
    }
    
    // Si no tiene código de país y es corto, asumir Colombia si el usuario no puso nada
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
        // Podría ser un número local, pero lo ideal es que tenga 10 dígitos
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Plantillas de mensajes predefinidas
 */
export const WA_TEMPLATES = {
    WELCOME: (name, hotel, room) => 
        `Hola *${name}*, ¡bienvenido al *Hotel Balcón ${hotel}*! 👋\n\nTu registro en la habitación *${room}* se ha realizado con éxito. ✅\n\nEs un gusto tenerte con nosotros. Si necesitas algo, no dudes en escribirnos por este medio. ✨`,
    
    BILL: (name, hotel, total, saldo) => 
        `Hola *${name}*, adjuntamos el resumen de tu cuenta en el *Hotel Balcón ${hotel}*:\n\n💰 *Consumos y Estancia:* $${total}\n💳 *Saldo Pendiente:* $${saldo}\n\nGracias por elegirnos. 🙏`,
    
    CHECKOUT: (name, hotel) => 
        `Hola *${name}*, esperamos que hayas tenido una excelente estadía en el *Hotel Balcón ${hotel}*. 😊\n\nTu check-out se ha realizado con éxito. ¡Vuelve pronto! 🏨`,

    FAST_CONTACT: (name, hotel) => 
        `Hola *${name}*, te saludamos desde la recepción del *Hotel Balcón ${hotel}*. ¿En qué podemos ayudarte?`
};

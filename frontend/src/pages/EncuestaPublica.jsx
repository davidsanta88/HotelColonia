import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.hotelbalconplaza.com';

const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-1">
        <p className="text-xs font-black text-slate-600 uppercase tracking-wide">{label}</p>
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => onChange(n)} type="button"
                    className={`p-1 transition-all ${n <= value ? 'text-yellow-400' : 'text-slate-200'}`}>
                    <Star size={28} fill={n <= value ? '#facc15' : 'none'} />
                </button>
            ))}
        </div>
    </div>
);

const EncuestaPublica = () => {
    const { token } = useParams();
    const [encuesta, setEncuesta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        calificacion_general: 0,
        calificacion_limpieza: 0,
        calificacion_atencion: 0,
        calificacion_instalaciones: 0,
        recomendaria: null,
        comentario: ''
    });

    useEffect(() => {
        axios.get(`${API_URL}/api/encuestas/responder/${token}`)
            .then(r => { setEncuesta(r.data); if (r.data.completada) setEnviado(true); })
            .catch(() => setError('Encuesta no encontrada o enlace inválido'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.calificacion_general || !form.calificacion_limpieza || !form.calificacion_atencion || !form.calificacion_instalaciones || form.recomendaria === null) {
            setError('Por favor completa todas las calificaciones');
            return;
        }
        try {
            await axios.post(`${API_URL}/api/encuestas/responder/${token}`, form);
            setEnviado(true);
        } catch (e) {
            setError(e.response?.data?.message || 'Error al enviar');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
                <div className="text-center mb-6">
                    <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain mx-auto rounded-2xl mb-3 shadow" />
                    <h1 className="text-2xl font-black text-slate-900">¡Tu opinión nos importa!</h1>
                    <p className="text-slate-500 text-sm mt-1">{encuesta?.hotel} · Hab. {encuesta?.habitacion_numero}</p>
                    {encuesta?.huesped_nombre && <p className="text-indigo-600 font-bold text-sm">Hola, {encuesta.huesped_nombre}</p>}
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm font-bold">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {enviado ? (
                    <div className="text-center py-8 space-y-4">
                        <CheckCircle size={64} className="mx-auto text-emerald-500" />
                        <h2 className="text-xl font-black text-slate-800">¡Gracias por tu opinión!</h2>
                        <p className="text-slate-500 text-sm">Tu calificación nos ayuda a mejorar. Esperamos verte pronto.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <StarRating label="Calificación General" value={form.calificacion_general} onChange={v => setForm(f => ({ ...f, calificacion_general: v }))} />
                        <StarRating label="Limpieza de la habitación" value={form.calificacion_limpieza} onChange={v => setForm(f => ({ ...f, calificacion_limpieza: v }))} />
                        <StarRating label="Atención del personal" value={form.calificacion_atencion} onChange={v => setForm(f => ({ ...f, calificacion_atencion: v }))} />
                        <StarRating label="Instalaciones y comodidades" value={form.calificacion_instalaciones} onChange={v => setForm(f => ({ ...f, calificacion_instalaciones: v }))} />

                        <div className="space-y-2">
                            <p className="text-xs font-black text-slate-600 uppercase tracking-wide">¿Nos recomendarías?</p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setForm(f => ({ ...f, recomendaria: true }))}
                                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${form.recomendaria === true ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    Sí 👍
                                </button>
                                <button type="button" onClick={() => setForm(f => ({ ...f, recomendaria: false }))}
                                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${form.recomendaria === false ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    No 👎
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-black text-slate-600 uppercase tracking-wide">Comentarios (opcional)</p>
                            <textarea value={form.comentario} onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))}
                                rows={3} placeholder="Cuéntanos tu experiencia..."
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                        </div>

                        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-200">
                            Enviar calificación
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EncuestaPublica;

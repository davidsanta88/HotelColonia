import React, { useState } from 'react';
import { 
    Book, 
    Settings, 
    Download, 
    FileText, 
    Code, 
    Database, 
    Server, 
    Layout, 
    Shield, 
    Smartphone, 
    Users, 
    Hotel, 
    Calendar, 
    ShoppingBag, 
    PieChart, 
    ArrowRight,
    CheckCircle,
    Info,
    Layers,
    Activity,
    Cpu,
    LogOut,
    ChevronDown,
    ChevronUp,
    MousePointer2,
    DollarSign,
    Box,
    Clock,
    Zap
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Manuales = () => {
    const [activeTab, setActiveTab] = useState('usuario');
    const [expandedStep, setExpandedStep] = useState(0);

    const dummyData = [
        { name: 'Lun', ingresos: 4000, gastos: 2400 },
        { name: 'Mar', ingresos: 3000, gastos: 1398 },
        { name: 'Mie', ingresos: 2000, gastos: 9800 },
        { name: 'Jue', ingresos: 2780, gastos: 3908 },
        { name: 'Vie', ingresos: 1890, gastos: 4800 },
        { name: 'Sab', ingresos: 2390, gastos: 3800 },
        { name: 'Dom', ingresos: 3490, gastos: 4300 },
    ];

    const checkinSteps = [
        {
            title: 'Selección de Habitación',
            desc: 'En el Mapa Visual, localice una habitación en color VERDE (Disponible) y haga clic sobre ella.',
            icon: <MousePointer2 className="text-blue-500" />
        },
        {
            title: 'Datos del Huésped',
            desc: 'Complete el formulario con el documento del titular. Si el cliente ya existe, sus datos se cargarán automáticamente.',
            icon: <Users className="text-purple-500" />
        },
        {
            title: 'Configuración de Estancia',
            desc: 'Defina la fecha de salida estimada y el valor por noche. Agregue acompañantes si es necesario.',
            icon: <Calendar className="text-orange-500" />
        },
        {
            title: 'Confirmación y Llaves',
            desc: 'Haga clic en "Guardar Registro". La habitación cambiará a ROJO (Ocupada) y podrá imprimir el comprobante.',
            icon: <Zap className="text-emerald-500" />
        }
    ];

    const downloadPDF = () => {
        const doc = new jsPDF();
        const addHeader = (title, subtitle) => {
            doc.setFillColor(15, 23, 42); 
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 20, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, 20, 30);
        };

        if (activeTab === 'usuario') {
            addHeader('Guía de Operación Estructurada', 'Hotel Balcón Plaza - Sistema de Gestión');
            
            let y = 50;
            const sections = [
                { title: '1. MAPA DE HABITACIONES (VISUAL)', content: 'El mapa es el corazón operativo. \n- Verde: Libre. \n- Rojo: Ocupada. \n- Amarillo: Reservada. \n- Azul: Limpieza Pendiente.' },
                { title: '2. PROCESO DE CHECK-IN', content: '1. Seleccione hab. verde. \n2. Ingrese titular (Doc/Nombre). \n3. Defina noches y tarifa. \n4. Guardar.' },
                { title: '3. VENTAS Y CONSUMOS', content: 'Use el módulo "Tienda" para cargar productos al folio del huésped. Esto se sumará automáticamente a su saldo final.' },
                { title: '4. CIERRE DE DÍA', content: 'Vaya a Cuadre de Caja, valide los ingresos recibidos (Efectivo, Transf, Tarjeta) y cierre el turno para asegurar la integridad contable.' }
            ];

            sections.forEach(s => {
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(14); doc.setFont('helvetica', 'bold');
                doc.text(s.title, 20, y); y += 10;
                doc.setFontSize(11); doc.setFont('helvetica', 'normal');
                const splitContent = doc.splitTextToSize(s.content, 170);
                doc.text(splitContent, 20, y); y += (splitContent.length * 6) + 15;
            });

        } else {
            addHeader('Documentación Técnica de Ingeniería', 'Arquitectura NoSQL y Micro-integraciones');
            let y = 50;
            const techSections = [
                { title: 'A. STACK TECNOLÓGICO', content: 'Frontend: React v18 (Vite build engine), TailwindCSS v3.\nBackend: Node.js (Express framework), Mongoose ODM.' },
                { title: 'B. ESTRUCTURA DE LA BASE DE DATOS', content: 'MongoDB Atlas en cluster global. Índices optimizados para búsquedas por número de documento y fechas de registro.' },
                { title: 'C. FLUJO DE AUTENTICACIÓN', content: 'JWT persistido en LocalStorage. Middleware de verificación intercepta peticiones a /api/* para validar claims de rol.' }
            ];
            techSections.forEach(s => {
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(14); doc.setFont('helvetica', 'bold');
                doc.text(s.title, 20, y); y += 10;
                doc.setFontSize(11); doc.setFont('helvetica', 'normal');
                const splitContent = doc.splitTextToSize(s.content, 170);
                doc.text(splitContent, 20, y); y += (splitContent.length * 6) + 15;
            });
        }
        doc.save(`Manual_Completo_Balcon_${activeTab.toUpperCase()}.pdf`);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 -m-6 p-6 md:p-10 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Visual Hero Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <Layers size={400} className="transform translate-x-20 -translate-y-20 rotate-12" />
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-full font-black text-[10px] uppercase tracking-widest border border-primary-500/30">
                                <Zap size={14} /> Guía del Administrador v2.4
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                                Domina el <span className="text-primary-500">Sistema</span> de tu Hotel.
                            </h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                                Una plataforma integrada para gestionar huéspedes, inventarios y finanzas con precisión absoluta. Aprende a utilizar cada herramienta hoy mismo.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <button 
                                    onClick={downloadPDF}
                                    className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                                >
                                    <Download size={20} /> Exportar Manual
                                </button>
                                <div className="flex p-1 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                    <button 
                                        onClick={() => setActiveTab('usuario')}
                                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'usuario' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Usuario
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('tecnico')}
                                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'tecnico' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Técnico
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="hidden lg:block relative group">
                            <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full group-hover:bg-primary-500/30 transition-all duration-1000"></div>
                            <img 
                                src={activeTab === 'usuario' ? "/manual/room_map.png" : "/manual/analytics.png"} 
                                alt="Dashboard Mockup" 
                                className="relative z-10 w-full rounded-[2rem] shadow-2xl border border-white/10 transform group-hover:-rotate-1 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </div>

                {activeTab === 'usuario' ? (
                    <div className="space-y-16">
                        
                        {/* Step by Step Interactive Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary-500 text-white p-3 rounded-2xl shadow-lg shadow-primary-200"><Activity size={24}/></div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Paso a Paso: Check-in de Huésped</h2>
                                    <p className="text-slate-500 font-medium italic">Sigue este flujo para asegurar un registro impecable.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {checkinSteps.map((step, idx) => (
                                    <div 
                                        key={idx}
                                        onMouseEnter={() => setExpandedStep(idx)}
                                        className={`p-8 rounded-[2.5rem] transition-all duration-500 cursor-pointer border-2 ${expandedStep === idx ? 'bg-white border-primary-500 shadow-2xl shadow-primary-100 -translate-y-2' : 'bg-white/50 border-slate-100 grayscale opacity-70'}`}
                                    >
                                        <div className="flex flex-col gap-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100">
                                                {step.icon}
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Paso {idx + 1}</span>
                                                <h4 className="font-black text-slate-900 leading-tight">{step.title}</h4>
                                                {expandedStep === idx && (
                                                    <p className="text-slate-500 text-xs font-medium leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                                        {step.desc}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual Modules Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Analytics Explanation */}
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Interpretación de Reportes</h3>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Módulo de Estadísticas</p>
                                    </div>
                                    <PieChart className="text-blue-500" size={32} />
                                </div>
                                
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dummyData}>
                                            <defs>
                                                <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                            />
                                            <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIng)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl">
                                        <Info className="text-blue-500 shrink-0 mt-1" size={18} />
                                        <p className="text-sm text-blue-900 font-medium">
                                            La línea azul representa los ingresos brutos. Los picos suelen ocurrir en fines de semana o temporadas altas. Puedes filtrar por fecha para comparar meses.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Features Showcase */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 flex flex-col justify-between group overflow-hidden relative">
                                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <ShoppingBag size={150} />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="bg-white/20 p-3 rounded-xl w-fit"><DollarSign size={24} /></div>
                                        <h4 className="text-xl font-black">POS y Tienda</h4>
                                        <p className="text-white/80 text-xs font-medium leading-relaxed">Cobra snacks y servicios adicionales directamente a la habitación del huésped. Sin complicaciones de efectivo al momento.</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mt-6 group-hover:gap-4 transition-all relative z-10">
                                        Ver guía <ArrowRight size={14} />
                                    </button>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 flex flex-col justify-between group overflow-hidden relative">
                                    <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <Box size={150} />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="bg-white/10 p-3 rounded-xl w-fit"><Box size={24} /></div>
                                        <h4 className="text-xl font-black">Inventarios</h4>
                                        <p className="text-white/60 text-xs font-medium leading-relaxed">Controla el stock de lencería, aseo y productos de venta. El sistema alerta cuando hay existencias bajas.</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mt-6 group-hover:gap-4 transition-all relative z-10 text-primary-400">
                                        Explorar <ArrowRight size={14} />
                                    </button>
                                </div>

                                <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
                                    <div className="hidden md:flex w-24 h-24 bg-orange-50 rounded-full items-center justify-center text-orange-500 shrink-0">
                                        <Clock size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Cierres de Turno Eficientes</h4>
                                        <p className="text-slate-500 text-sm font-medium">
                                            Al finalizar tu jornada, el sistema consolida todas las transacciones por medio de pago. Simplemente valida el efectivo físico contra el reporte del sistema.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Tech Specs Table */}
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Cpu size={24} /></div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Especificaciones Técnicas</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Frameworks</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> React 18.2</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Express 4.18</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Tailwind 3.4</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Persistencia</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> MongoDB Atlas</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Mongoose ODM</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Cloudinary API</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Infraestructura</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> Vercel Deploy</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> CI/CD Pipeline</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div> HTTPS / TLS</li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Seguridad</h5>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> JWT Auth</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> BCrypt Hashing</li>
                                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> RBAC granular</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* DB Schema Illustration (Visual) */}
                        <div className="bg-slate-900 p-12 rounded-[3rem] text-white space-y-12">
                            <div className="text-center space-y-4 max-w-2xl mx-auto">
                                <h3 className="text-4xl font-black tracking-tight">Arquitectura de Datos NoSQL</h3>
                                <p className="text-slate-400 font-medium">Diseño orientado a documentos para alta disponibilidad y baja latencia.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
                                    <div className="flex items-center gap-3 text-primary-400 font-black uppercase tracking-widest text-xs">
                                        <Database size={16} /> Colección: Registros
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-400 bg-black/30 p-4 rounded-xl overflow-hidden">
                                        {`{
  _id: ObjectId,
  habitacion: Ref(Habitacion),
  huesped: Ref(Cliente),
  entrada: Date,
  salida: Date,
  total: Number,
  pagado: Number,
  estado: "ACTIVO"
}`}
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
                                    <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest text-xs">
                                        <Database size={16} /> Colección: Ventas
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-400 bg-black/30 p-4 rounded-xl overflow-hidden">
                                        {`{
  _id: ObjectId,
  registro: Ref(Registro),
  productos: [{
    prod: Ref(Producto),
    cant: Number,
    precio: Number
  }],
  total: Number,
  pago: Ref(MedioPago)
}`}
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-6">
                                    <div className="flex items-center gap-3 text-orange-400 font-black uppercase tracking-widest text-xs">
                                        <Database size={16} /> Colección: Users
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-400 bg-black/30 p-4 rounded-xl overflow-hidden">
                                        {`{
  _id: ObjectId,
  nombre: String,
  rol: Ref(Rol),
  permisos: [{
    p: "manuales",
    v: true,
    e: false
  }],
  lastLogin: Date
}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Documentation Help */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                            <Book size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">¿Alguna duda adicional?</h4>
                            <p className="text-slate-500 font-medium">Esta documentación se actualiza automáticamente con cada versión del software.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all">Soporte Técnico</button>
                        <button className="px-8 py-4 border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">Vídeos Tutoriales</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Manuales;

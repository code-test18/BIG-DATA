import { useState, useEffect } from 'react';
import { Mail, Phone, User, Calendar, CheckCircle, Clock, Trash2, Inbox } from 'lucide-react';

interface Solicitud {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
  fecha: string;
  estado: 'PENDIENTE' | 'ATENDIDO';
}

const SOLICITUDES_INICIALES: Solicitud[] = [
  {
    id: '1',
    nombre: 'Carlos Mendoza',
    email: 'carlos.mendoza@example.com',
    telefono: '+51 987654321',
    mensaje: 'Hola, me interesa contratar el plan empresarial para optimizar las ventas de mi sucursal.',
    fecha: '2026-09-10 14:30',
    estado: 'PENDIENTE',
  },
  {
    id: '2',
    nombre: 'Ana Torres',
    email: 'ana.torres@example.com',
    telefono: '+51 912345678',
    mensaje: 'Solicito información sobre los reportes automatizados de inventario.',
    fecha: '2026-09-09 11:15',
    estado: 'ATENDIDO',
  },
];

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'ATENDIDO'>('TODOS');

  useEffect(() => {
    const cargarDatosSimulados = async () => {
      setCargando(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSolicitudes(SOLICITUDES_INICIALES);
      } catch (error) {
        console.error('Error al cargar solicitudes:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatosSimulados();
  }, []);

  const cambiarEstado = (id: string, nuevoEstado: 'PENDIENTE' | 'ATENDIDO') => {
    setSolicitudes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado: nuevoEstado } : item))
    );
  };

  const eliminarSolicitud = (id: string) => {
    setSolicitudes((prev) => prev.filter((item) => item.id !== id));
  };

  const solicitudesFiltradas = solicitudes.filter((item) => {
    if (filtro === 'TODOS') return true;
    return item.estado === filtro;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/20 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
            <Inbox size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Solicitudes de Clientes</h1>
            <p className="text-sm text-slate-500 mt-0.5">Bandeja de mensajes entrantes desde la landing page.</p>
          </div>
        </div>

        {/* Segmented filter control */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {(['TODOS', 'PENDIENTE', 'ATENDIDO'] as const).map((estadoItem) => (
            <button
              key={estadoItem}
              onClick={() => setFiltro(estadoItem)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                filtro === estadoItem
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {estadoItem}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      {cargando ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-medium">
          Cargando solicitudes...
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
          <Inbox size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-slate-600">No hay solicitudes en esta sección.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solicitudesFiltradas.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100/80 p-6 flex flex-col justify-between space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Top border accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${item.estado === 'PENDIENTE' ? 'bg-amber-400' : 'bg-emerald-500'}`} />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                      item.estado === 'PENDIENTE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}
                  >
                    {item.estado === 'PENDIENTE' ? <Clock size={13} /> : <CheckCircle size={13} />}
                    {item.estado}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar size={13} /> {item.fecha}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                    <User size={16} className="text-blue-600" /> {item.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" /> {item.email}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" /> {item.telefono}
                  </p>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-xl text-sm text-slate-600 border border-slate-100 leading-relaxed">
                  <p className="italic">"{item.mensaje}"</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {item.estado === 'PENDIENTE' ? (
                  <button
                    onClick={() => cambiarEstado(item.id, 'ATENDIDO')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/60 hover:bg-emerald-100/60 transition-colors"
                  >
                    <CheckCircle size={14} /> Atender
                  </button>
                ) : (
                  <button
                    onClick={() => cambiarEstado(item.id, 'PENDIENTE')}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/60 hover:bg-amber-100/60 transition-colors"
                  >
                    <Clock size={14} /> Reactivar
                  </button>
                )}

                <button
                  onClick={() => eliminarSolicitud(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Eliminar solicitud"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
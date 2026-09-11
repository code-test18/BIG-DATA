import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { CheckCircle2, Save, Trash2, Tag, DollarSign, PieChart as PieIcon, Percent } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { completarTarea, listarTareas } from '../../services/tareaService';
import { marcarComoLimpio } from '../../services/csvService';
import type { DashboardContextType } from '../../types/csv';
import type { Tarea } from '../../types/tarea';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface Oferta {
  id: string;
  nombre: string;
  segmento: string;
  producto: string;
  descuento: string;
  estado: string;
  inicioOferta: string;
  finPromocion: string;
  descripcion: string;
}

interface Promocion {
  id: string;
  nombreCampana: string;
  canal: string;
  tipo: string;
  presupuesto: string;
  objetivoIngreso: string;
  fechaInicio: string;
  finPromocion: string;
  estado: string;
}

const Inteligencia: React.FC = () => {
  const { files, updateFile } = useOutletContext<DashboardContextType>();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState('');
  const [csvSeleccionado, setCsvSeleccionado] = useState('');
  const [columnaNueva, setColumnaNueva] = useState('');
  const [valorInicial, setValorInicial] = useState('');
  const [guardandoCambio, setGuardandoCambio] = useState(false);
  const [mensajeCambio, setMensajeCambio] = useState<string | null>(null);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<'ofertas' | 'promociones'>('ofertas');

  const [listaOfertas, setListaOfertas] = useState<Oferta[]>([]);
  const [listaPromociones, setListaPromociones] = useState<Promocion[]>([]);

  // Formulario Oferta
  const [ofertaForm, setOfertaForm] = useState({
    nombre: '',
    segmento: 'Verano',
    producto: '',
    descuento: '',
    estado: 'Activo',
    inicioOferta: '',
    finPromocion: '',
    descripcion: '',
  });

  // Formulario Promoción
  const [promocionForm, setPromocionForm] = useState({
    nombreCampana: '',
    canal: 'venta directa física',
    tipo: '2x1',
    presupuesto: '',
    objetivoIngreso: '',
    fechaInicio: '',
    finPromocion: '',
    estado: 'Activo',
  });

  const tareasDisponibles = tareas.filter((tarea) => tarea.estado !== 'COMPLETADA');
  const tareaActual = tareas.find((tarea) => tarea.id === tareaSeleccionada);
  const csvDisponibles = files.filter((file) =>
    (file.origen ?? 'propio') === 'propio' || file.id === tareaActual?.datasetPropioId,
  );
  const csvActual = csvDisponibles.find((file) => file.id === csvSeleccionado);

  useEffect(() => {
    void listarTareas().then(setTareas).catch(() => setErrorCambio('No se pudieron cargar las tareas asignadas.'));
  }, []);

  useEffect(() => {
    if (!tareaActual?.columnaRelacionada) return;
    setColumnaNueva(tareaActual.columnaRelacionada);
  }, [tareaActual?.id, tareaActual?.columnaRelacionada]);

  useEffect(() => {
    if (tareaActual?.datasetPropioId && csvDisponibles.some((file) => file.id === tareaActual.datasetPropioId)) {
      setCsvSeleccionado(tareaActual.datasetPropioId);
    }
  }, [tareaActual?.id, tareaActual?.datasetPropioId, csvDisponibles]);

  const handleAplicarCambio = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tareaActual || !csvActual || !columnaNueva.trim()) return;
    if (csvActual.headers.includes(columnaNueva.trim())) {
      setErrorCambio('Esa columna ya existe en el CSV seleccionado.');
      return;
    }

    setGuardandoCambio(true);
    setMensajeCambio(null);
    setErrorCambio(null);
    try {
      const nombreColumna = columnaNueva.trim();
      const filasActualizadas = csvActual.rows.map((row) => [...row, valorInicial]);
      const archivoActualizado = {
        ...csvActual,
        headers: [...csvActual.headers, nombreColumna],
        rows: filasActualizadas,
        isClean: true,
      };

      if (csvActual.synced && csvActual.id) {
        const contenido = [archivoActualizado.headers, ...filasActualizadas]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n');
        const archivo = new File([contenido], `${csvActual.name.replace(/\.csv$/i, '')}-actualizado.csv`, { type: 'text/csv' });
        await marcarComoLimpio(csvActual.id, archivo, { filasCount: filasActualizadas.length, columnCount: archivoActualizado.headers.length });
      }

      updateFile(archivoActualizado);
      const tareaCompletada = await completarTarea(tareaActual.id);
      setTareas((actuales) => actuales.map((tarea) => (tarea.id === tareaCompletada.id ? tareaCompletada : tarea)));
      setMensajeCambio(`Se agregó la columna "${nombreColumna}" y se completó la tarea.`);
      setColumnaNueva('');
      setValorInicial('');
    } catch (err) {
      setErrorCambio(err instanceof Error ? err.message : 'No se pudo guardar el cambio en el CSV.');
    } finally {
      setGuardandoCambio(false);
    }
  };

  // Handlers para agregar
  const handleCrearOferta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ofertaForm.nombre) return;
    const nuevaOferta: Oferta = { ...ofertaForm, id: Date.now().toString() };
    setListaOfertas([...listaOfertas, nuevaOferta]);
    setOfertaForm({
      nombre: '',
      segmento: 'Verano',
      producto: '',
      descuento: '',
      estado: 'Activo',
      inicioOferta: '',
      finPromocion: '',
      descripcion: '',
    });
  };

  const handleCrearPromocion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promocionForm.nombreCampana) return;
    const nuevaPromocion: Promocion = { ...promocionForm, id: Date.now().toString() };
    setListaPromociones([...listaPromociones, nuevaPromocion]);
    setPromocionForm({
      nombreCampana: '',
      canal: 'venta directa física',
      tipo: '2x1',
      presupuesto: '',
      objetivoIngreso: '',
      fechaInicio: '',
      finPromocion: '',
      estado: 'Activo',
    });
  };

  // Handlers para eliminar
  const eliminarOferta = (id: string) => {
    setListaOfertas(listaOfertas.filter((item) => item.id !== id));
  };

  const eliminarPromocion = (id: string) => {
    setListaPromociones(listaPromociones.filter((item) => item.id !== id));
  };

  // --- CÁLCULOS DE TARJETAS KPI ---
  const totalOfertas = listaOfertas.length;

  const totalInversiones = listaPromociones.reduce(
    (acc, curr) => acc + (Number(curr.presupuesto) || 0),
    0
  );

  const totalObjetivoIngresos = listaPromociones.reduce(
    (acc, curr) => acc + (Number(curr.objetivoIngreso) || 0),
    0
  );

  const roiPromedio =
    totalInversiones > 0
      ? Math.round(((totalObjetivoIngresos - totalInversiones) / totalInversiones) * 100)
      : 0;

  // Datos para Gráfico Circular
  const conteoSegmentos = listaOfertas.reduce((acc, curr) => {
    acc[curr.segmento] = (acc[curr.segmento] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const doughnutData = {
    labels: Object.keys(conteoSegmentos),
    datasets: [
      {
        data: Object.values(conteoSegmentos),
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#00b4d8', '#f97316'],
        borderWidth: 0,
      },
    ],
  };

  // Datos para Gráfico de Barras
  const barData = {
    labels: listaPromociones.map((p) => p.nombreCampana),
    datasets: [
      {
        label: 'Presupuesto ($)',
        data: listaPromociones.map((p) => Number(p.presupuesto) || 0),
        backgroundColor: '#94a3b8',
      },
      {
        label: 'Objetivo Ingreso ($)',
        data: listaPromociones.map((p) => Number(p.objetivoIngreso) || 0),
        backgroundColor: '#00b4d8',
      },
    ],
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '5px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  };

  // COMPONENTE DE TARJETAS DE MÉTRICAS (KPIs)
  const TargetasKPI = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
      
      {/* 1. Ofertas registradas */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Ofertas registradas</p>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{totalOfertas}</h2>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34a853' }}>
          <Tag size={20} />
        </div>
      </div>

      {/* 2. Inversiones totales */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Inversiones totales</p>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>US$ {totalInversiones.toLocaleString()}</h2>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#eaf8e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d32' }}>
          <DollarSign size={20} />
        </div>
      </div>

      {/* 3. Presupuesto en campañas */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Presupuesto en campañas</p>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>US$ {totalObjetivoIngresos.toLocaleString()}</h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>(presupuestado)</span>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#f0ebf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b21a8' }}>
          <PieIcon size={20} />
        </div>
      </div>

      {/* 4. ROI promedio */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>ROI promedio</p>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{roiPromedio}%</h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sobre el ingreso: US$ {totalObjetivoIngresos.toLocaleString()}</span>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e8f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
          <Percent size={20} />
        </div>
      </div>

    </div>
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      <section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #bae6fd', marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <CheckCircle2 size={22} color="#0284c7" />
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>Trabajo asignado</h2>
        </div>
        <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px' }}>
          Aplica en tu CSV los cambios detectados por el Analista y completa la tarea cuando termines.
        </p>

        {mensajeCambio && <div className="alert-success" style={{ marginBottom: '14px' }}>{mensajeCambio}</div>}
        {errorCambio && <div className="alert-error" style={{ marginBottom: '14px' }}>{errorCambio}</div>}

        {!tareasDisponibles.length ? (
          <p style={{ margin: 0, color: '#64748b' }}>No tienes tareas pendientes.</p>
        ) : (
          <form onSubmit={handleAplicarCambio}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={labelStyle} htmlFor="tarea-inteligencia">Tarea</label>
                <select id="tarea-inteligencia" value={tareaSeleccionada} onChange={(event) => setTareaSeleccionada(event.target.value)} style={inputStyle} required>
                  <option value="">Selecciona una tarea</option>
                  {tareasDisponibles.map((tarea) => <option key={tarea.id} value={tarea.id}>{tarea.titulo}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="csv-inteligencia">CSV propio</label>
                <select id="csv-inteligencia" value={csvSeleccionado} onChange={(event) => setCsvSeleccionado(event.target.value)} style={inputStyle} required>
                  <option value="">Selecciona un archivo</option>
                  {csvDisponibles.map((file) => <option key={file.id} value={file.id}>{file.name} ({file.origen === 'otro' ? 'competencia' : 'propio'})</option>)}
                </select>
              </div>
            </div>

            {tareaActual && <p style={{ margin: '0 0 15px', padding: '12px', backgroundColor: '#f0f9ff', color: '#0c4a6e', borderRadius: '6px', fontSize: '14px' }}>{tareaActual.descripcion}</p>}

            {tareaActual?.datasetPropioId && <p style={{ margin: '-5px 0 15px', color: '#64748b', fontSize: '12px' }}>Esta tarea está relacionada con un CSV propio específico.</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={labelStyle} htmlFor="columna-nueva">Nombre de la columna faltante</label>
                <input id="columna-nueva" value={columnaNueva} onChange={(event) => setColumnaNueva(event.target.value)} style={inputStyle} placeholder="Ej. descuento" required />
              </div>
              <div>
                <label style={labelStyle} htmlFor="valor-inicial">Valor inicial para las filas existentes</label>
                <input id="valor-inicial" value={valorInicial} onChange={(event) => setValorInicial(event.target.value)} style={inputStyle} placeholder="Ej. 0" />
              </div>
            </div>

            <button type="submit" disabled={guardandoCambio || !csvActual} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              <Save size={16} />
              {guardandoCambio ? 'Guardando...' : 'Guardar cambio y completar tarea'}
            </button>
          </form>
        )}
      </section>
      
      {/* TABS DE NAVEGACIÓN */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setTabActiva('ofertas')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: tabActiva === 'ofertas' ? '#00b4d8' : '#e2e8f0',
            color: tabActiva === 'ofertas' ? '#ffffff' : '#475569',
          }}
        >
          Ofertas
        </button>
        <button
          onClick={() => setTabActiva('promociones')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: tabActiva === 'promociones' ? '#00b4d8' : '#e2e8f0',
            color: tabActiva === 'promociones' ? '#ffffff' : '#475569',
          }}
        >
          Promociones
        </button>
      </div>

      {/* PESTAÑA OFERTAS */}
      {tabActiva === 'ofertas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* TARJETAS DE MÉTRICAS ARRIBA */}
          <TargetasKPI />

          {/* GRÁFICO CIRCULAR (SI HAY OFERTAS) */}
          {listaOfertas.length > 0 && (
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
                Ofertas por segmento
              </h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#64748b' }}>
                Distribución de ofertas activas por temporada
              </p>
              <div style={{ height: '220px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          )}

          {/* FORMULARIO NUEVA OFERTA */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>Nueva Oferta</h2>
            <form onSubmit={handleCrearOferta}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre de la oferta"
                    value={ofertaForm.nombre}
                    onChange={(e) => setOfertaForm({ ...ofertaForm, nombre: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Segmento</label>
                  <select
                    value={ofertaForm.segmento}
                    onChange={(e) => setOfertaForm({ ...ofertaForm, segmento: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Verano">Verano</option>
                    <option value="Invierno">Invierno</option>
                    <option value="Otoño">Otoño</option>
                    <option value="Primavera">Primavera</option>
                    <option value="Navidad">Navidad</option>
                    <option value="Año Nuevo">Año Nuevo</option>
                    <option value="Black Friday">Black Friday</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Producto</label>
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={ofertaForm.producto}
                    onChange={(e) => setOfertaForm({ ...ofertaForm, producto: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Descuento</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      placeholder="0"
                      value={ofertaForm.descuento}
                      onChange={(e) => setOfertaForm({ ...ofertaForm, descuento: e.target.value })}
                      style={inputStyle}
                    />
                    <span style={{ fontWeight: 'bold' }}>%</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select
                    value={ofertaForm.estado}
                    onChange={(e) => setOfertaForm({ ...ofertaForm, estado: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Descatalogado">Descatalogado</option>
                    <option value="Obsoleto">Obsoleto</option>
                    <option value="Fin de vida útil">Fin de vida útil</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Inicio de oferta</label>
                  <input
                    type="date"
                    value={ofertaForm.inicioOferta}
                    onChange={(e) => setOfertaForm({ ...ofertaForm, inicioOferta: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fin de promoción</label>
                  <input
                    type="date"
                    value={ofertaForm.finPromocion}
                    onChange={(e) => setOfertaForm({ ...ofertaForm, finPromocion: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Detalles adicionales..."
                  value={ofertaForm.descripcion}
                  onChange={(e) => setOfertaForm({ ...ofertaForm, descripcion: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#00b4d8',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Crear Oferta
              </button>
            </form>
          </div>

          {/* TABLA DE OFERTAS (ABAJO) */}
          {listaOfertas.length > 0 && (
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>
                Ofertas Registradas
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px' }}>Nombre</th>
                    <th style={{ padding: '10px' }}>Segmento</th>
                    <th style={{ padding: '10px' }}>Descuento</th>
                    <th style={{ padding: '10px' }}>Estado</th>
                    <th style={{ padding: '10px' }}>Fechas</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaOfertas.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{item.nombre}</td>
                      <td style={{ padding: '10px' }}>{item.segmento}</td>
                      <td style={{ padding: '10px' }}>{item.descuento}%</td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: item.estado === 'Activo' ? '#dcfce7' : '#f3f4f6',
                            color: item.estado === 'Activo' ? '#166534' : '#374151',
                          }}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>
                        {item.inicioOferta} al {item.finPromocion}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => eliminarOferta(item.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA PROMOCIONES */}
      {tabActiva === 'promociones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* TARJETAS DE MÉTRICAS ARRIBA */}
          <TargetasKPI />

          {/* GRÁFICO DE BARRAS (SI HAY PROMOCIONES) */}
          {listaPromociones.length > 0 && (
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
                Presupuesto vs. Objetivo
              </h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#64748b' }}>
                Comparativa de presupuesto e ingresos proyectados
              </p>
              <div style={{ height: '220px' }}>
                <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
              </div>
            </div>
          )}

          {/* FORMULARIO NUEVA PROMOCIÓN */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>Nueva Promoción</h2>
            <form onSubmit={handleCrearPromocion}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Nombre de la campaña</label>
                  <input
                    type="text"
                    placeholder="Nombre de la campaña"
                    value={promocionForm.nombreCampana}
                    onChange={(e) => setPromocionForm({ ...promocionForm, nombreCampana: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Canal</label>
                  <select
                    value={promocionForm.canal}
                    onChange={(e) => setPromocionForm({ ...promocionForm, canal: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="venta directa física">Venta directa física</option>
                    <option value="tienda online">Tienda online</option>
                    <option value="marketplaces">Marketplaces</option>
                    <option value="distribución indirecta">Distribución indirecta</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select
                    value={promocionForm.tipo}
                    onChange={(e) => setPromocionForm({ ...promocionForm, tipo: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="2x1">2x1</option>
                    <option value="3x2">3x2</option>
                    <option value="Segunda unidad al 50%">Segunda unidad al 50%</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={labelStyle}>Presupuesto</label>
                  <input
                    type="number"
                    placeholder="Monto de presupuesto"
                    value={promocionForm.presupuesto}
                    onChange={(e) => setPromocionForm({ ...promocionForm, presupuesto: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Objetivo de ingreso</label>
                  <input
                    type="number"
                    placeholder="Monto objetivo"
                    value={promocionForm.objetivoIngreso}
                    onChange={(e) => setPromocionForm({ ...promocionForm, objetivoIngreso: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select
                    value={promocionForm.estado}
                    onChange={(e) => setPromocionForm({ ...promocionForm, estado: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Descatalogado">Descatalogado</option>
                    <option value="Obsoleto">Obsoleto</option>
                    <option value="Fin de vida útil">Fin de vida útil</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Fecha de inicio</label>
                  <input
                    type="date"
                    value={promocionForm.fechaInicio}
                    onChange={(e) => setPromocionForm({ ...promocionForm, fechaInicio: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fin de promoción</label>
                  <input
                    type="date"
                    value={promocionForm.finPromocion}
                    onChange={(e) => setPromocionForm({ ...promocionForm, finPromocion: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#00b4d8',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Crear Promoción
              </button>
            </form>
          </div>

          {/* TABLA DE PROMOCIONES (ABAJO) */}
          {listaPromociones.length > 0 && (
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>
                Promociones Registradas
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px' }}>Campaña</th>
                    <th style={{ padding: '10px' }}>Canal</th>
                    <th style={{ padding: '10px' }}>Tipo</th>
                    <th style={{ padding: '10px' }}>Presupuesto</th>
                    <th style={{ padding: '10px' }}>Objetivo</th>
                    <th style={{ padding: '10px' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaPromociones.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{item.nombreCampana}</td>
                      <td style={{ padding: '10px' }}>{item.canal}</td>
                      <td style={{ padding: '10px' }}>{item.tipo}</td>
                      <td style={{ padding: '10px' }}>${item.presupuesto}</td>
                      <td style={{ padding: '10px', color: '#10b981', fontWeight: 'bold' }}>
                        ${item.objetivoIngreso}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: item.estado === 'Activo' ? '#dcfce7' : '#f3f4f6',
                            color: item.estado === 'Activo' ? '#166534' : '#374151',
                          }}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => eliminarPromocion(item.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inteligencia;
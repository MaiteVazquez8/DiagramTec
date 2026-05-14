import Icon from './Icon.jsx';

// iconos svg para la interfaz
/* ── SVG Icons ── */
export const SearchIcon = () => <Icon name="search" />;
export const PlusIcon = () => <Icon name="plus" />;
export const ImageIcon = () => <Icon name="image" size={48} strokeWidth={1.2} />;
export const ChevronLeftIcon = () => <Icon name="chevronLeft" size={20} strokeWidth={2.5} />;
export const ChevronRightIcon = () => <Icon name="chevronRight" size={20} strokeWidth={2.5} />;
export const SaveIcon = () => <Icon name="save" size={16} />;
export const TrashIcon = () => <Icon name="trash" size={16} />;
export const DownloadIcon = () => <Icon name="download" size={16} />;
export const ZoomInIcon = () => <Icon name="zoomIn" size={16} />;
export const ZoomOutIcon = () => <Icon name="zoomOut" size={16} />;
export const CopyIcon = () => <Icon name="copy" />;
export const LayersIcon = () => <Icon name="layers" />;
export const UndoIcon = () => <Icon name="undo" />;
export const RedoIcon = () => <Icon name="redo" />;
export const ArrowLeft = () => <Icon name="chevronLeft" />;
export const SmallImageIcon = () => <Icon name="image" size={16} />;
export const CommentIcon = () => <Icon name="comment" size={16} />;
export const UploadIcon = () => <Icon name="upload" />;
export const ClockIcon = () => <Icon name="clock" size={14} />;
export const SendIcon = () => <Icon name="send" />;
export const ChevronUp = () => <Icon name="chevronUp" />;
export const ChevronDown = () => <Icon name="chevronDown" />;
export const ArrowIcon = () => <Icon name="chevronRight" size={20} />;
export const BookIcon = () => <Icon name="book" size={22} />;
export const EmptyClassIcon = () => <Icon name="emptyClass" size={56} strokeWidth={1} />;

// datos de la paleta de componentes para el editor
/* ── Palette Data ── */
export const palette = [
  { type: 'start', label: 'Inicio' },
  { type: 'end', label: 'Final' },
  { type: 'connect', label: 'Conexión' },
  { type: 'input', label: 'Entrada / Input' },
  { type: 'print', label: 'Salida / Print' },
  { type: 'process', label: 'Proceso / Asignación' },
  { type: 'for', label: 'Ciclo FOR' },
  { type: 'while', label: 'Ciclo WHILE' },
  { type: 'if', label: 'Ciclo IF' },
];

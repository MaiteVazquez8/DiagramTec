/**
 * Wrappers de iconos legacy (Iconify) usados en páginas antiguas y editor.
 * Preferir <Icon name="..." /> directamente en código nuevo.
 */
import Icon from './Icon.jsx';

/* ── Componentes de icono preconfigurados (compatibilidad con código legacy) ── */
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

/* Re-export de constantes de paleta para no romper imports antiguos */
export { palette, SHAPE_TYPES, PALETTE_DRAG_TYPE_KEY } from '../design/constants/palette.js';

import { Icon as IconifyIcon } from '@iconify/react';



/**

 * Iconify — Tabler Icons (maquetado Figma / plugin Iconify).

 * @see https://icon-sets.iconify.design/tabler/

 */

export const ICONIFY_ICONS = {

  /* —— Editor subtoolbar —— */

  duplicate: 'fluent:copy-24-filled',
  bringToFront: 'fluent:copy-24-filled',

  paste: 'fluent:clipboard-paste-24-filled',

  delete: 'fluent:dismiss-circle-24-filled',

  undo: 'fluent:arrow-undo-24-filled',

  redo: 'fluent:arrow-redo-24-filled',

  copy: 'tabler:copy',

  layers: 'tabler:layout',

  select: 'tabler:select',

  cursor: 'tabler:pointer',



  /* —— Zoom / lienzo —— */

  plus: 'fluent:add-24-filled',

  minus: 'fluent:subtract-24-filled',

  zoomIn: 'tabler:zoom-in',

  zoomOut: 'tabler:zoom-out',

  trash: 'fluent:delete-24-regular',



  /* —— Guardar / archivos —— */

  save: 'tabler:cloud-upload',

  download: 'tabler:download',

  export: 'tabler:file-download',

  upload: 'tabler:photo-up',

  search: 'tabler:search',

  empty: 'tabler:folder',

  archive: 'tabler:archive',



  /* —— Navegación / flechas —— */

  chevronLeft: 'tabler:chevron-left',

  chevronRight: 'tabler:chevron-right',

  chevronUp: 'tabler:chevron-up',

  chevronDown: 'tabler:chevron-down',

  arrowBack: 'tabler:arrow-back',

  arrowUp: 'tabler:arrow-up',

  squareArrowUp: 'tabler:square-arrow-up',



  /* —— Header / sesión —— */

  menu: 'tabler:list-details',
  list: 'tabler:list',
  circleX: 'tabler:circle-x',

  close: 'tabler:x',

  user: 'tabler:user-cog',

  userEdit: 'tabler:user-edit',

  userX: 'tabler:user-x',

  login: 'tabler:login',

  logout: 'tabler:logout-2',



  /* —— Diseños / clases / mensajes —— */

  image: 'tabler:photo',

  eye: 'tabler:eye',

  eyeOff: 'tabler:eye-off',

  crop: 'tabler:crop',

  settings: 'tabler:settings',

  dots: 'tabler:dots',

  edit: 'tabler:pencil',

  share: 'tabler:link',

  connect: 'tabler:link',

  comment: 'tabler:message',

  messageEdit: 'tabler:message-plus',

  messagePlus: 'tabler:message-plus',

  video: 'tabler:video',

  clock: 'tabler:clock',

  send: 'tabler:send',

  book: 'tabler:book-filled',
  classBook: 'tabler:book-filled',
  bookmark: 'tabler:bookmark',

  emptyClass: 'tabler:users',

  google: 'mdi:google',
  usersGroup: 'tabler:users-group',

  filePlus: 'tabler:file-plus',

  folder: 'tabler:folder',

  folderEdit: 'tabler:file-pencil',

  folderCheck: 'tabler:folder-check',

  circleCheck: 'tabler:circle-check',

  help: 'tabler:help-circle',

};



export default function Icon({

  name,

  size = 18,

  className = '',

  strokeWidth: _strokeWidth,

  color,

  style,

  ...props

}) {

  const icon = ICONIFY_ICONS[name];



  if (!icon) {

    console.warn(`Icon "${name}" not found`);

    return null;

  }



  return (

    <IconifyIcon

      icon={icon}

      width={size}

      height={size}

      className={`icon icon-${name} ${className}`.trim()}

      style={{

        color: color || 'currentColor',

        flexShrink: 0,

        ...style,

      }}

      aria-hidden={props['aria-label'] ? undefined : true}

      {...props}

    />

  );

}



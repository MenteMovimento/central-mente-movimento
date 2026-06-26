export const AREA_IDS = ['socios', 'utentes', 'dispositivos']

export const AREA_ACTIONS = [
  'view',
  'edit',
  'view_sensitive',
  'edit_sensitive',
  'export',
  'delete',
]

const emptyAreaPermissions = () => ({
  view: false,
  edit: false,
  view_sensitive: false,
  edit_sensitive: false,
  export: false,
  delete: false,
})

const allAreaPermissions = ({ sensitive = true, deleteAllowed = true } = {}) => ({
  view: true,
  edit: true,
  view_sensitive: Boolean(sensitive),
  edit_sensitive: Boolean(sensitive),
  export: true,
  delete: Boolean(deleteAllowed),
})

const emptyPermissions = () => ({
  central: { manage_users: false, view_history: false },
  socios: emptyAreaPermissions(),
  utentes: emptyAreaPermissions(),
  dispositivos: emptyAreaPermissions(),
})

export const fullPermissions = () => ({
  central: { manage_users: true, view_history: true },
  socios: allAreaPermissions({ sensitive: false, deleteAllowed: true }),
  utentes: allAreaPermissions({ sensitive: true, deleteAllowed: true }),
  dispositivos: allAreaPermissions({ sensitive: false, deleteAllowed: true }),
})

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1'

export const normalizePermissions = (input) => {
  const normalized = emptyPermissions()
  const source = input && typeof input === 'object' ? input : {}

  normalized.central = {
    ...normalized.central,
    manage_users: toBoolean(source.central?.manage_users ?? normalized.central.manage_users),
    view_history: toBoolean(source.central?.view_history ?? normalized.central.view_history),
  }

  AREA_IDS.forEach((area) => {
    const sourceArea = source[area] && typeof source[area] === 'object' ? source[area] : {}
    const nextArea = { ...normalized[area] }

    AREA_ACTIONS.forEach((action) => {
      if (Object.prototype.hasOwnProperty.call(sourceArea, action)) {
        nextArea[action] = toBoolean(sourceArea[action])
      }
    })

    if (nextArea.edit) nextArea.view = true
    if (nextArea.export) nextArea.view = true
    if (nextArea.delete) {
      nextArea.view = true
      nextArea.edit = true
    }
    if (nextArea.view_sensitive) nextArea.view = true
    if (nextArea.edit_sensitive) {
      nextArea.view = true
      nextArea.edit = true
      nextArea.view_sensitive = true
    }

    if (area !== 'utentes') {
      nextArea.view_sensitive = false
      nextArea.edit_sensitive = false
    }

    normalized[area] = nextArea
  })

  return normalized
}

export const hasPermission = (profile, area, action) => {
  const permissions = normalizePermissions(profile?.permissions)
  if (area === 'central') return Boolean(permissions.central?.[action])
  if (!AREA_IDS.includes(area) || !AREA_ACTIONS.includes(action)) return false
  return Boolean(permissions[area]?.[action])
}

export const canManageUsers = (profile) => hasPermission(profile, 'central', 'manage_users')

export const canViewArea = (profile, area) => hasPermission(profile, area, 'view')

export const mapCentralPermissionsToDeviceRole = (permissions) => {
  const normalized = normalizePermissions(permissions)
  if (normalized.central.manage_users || normalized.dispositivos.delete) return 'admin'
  if (normalized.dispositivos.edit || normalized.dispositivos.export) return 'manager'
  return 'member'
}

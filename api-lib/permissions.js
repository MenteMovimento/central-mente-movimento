export const AREA_IDS = ['socios', 'utentes', 'dispositivos', 'atividades']

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
  atividades: emptyAreaPermissions(),
})

export const fullPermissions = () => ({
  central: { manage_users: true, view_history: true },
  socios: allAreaPermissions({ sensitive: false, deleteAllowed: true }),
  utentes: allAreaPermissions({ sensitive: true, deleteAllowed: true }),
  dispositivos: allAreaPermissions({ sensitive: false, deleteAllowed: true }),
  atividades: allAreaPermissions({ sensitive: false, deleteAllowed: false }),
})

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1'

const hasOwnPermission = (permissions, action) =>
  Object.prototype.hasOwnProperty.call(permissions, action)

export const normalizePermissions = (input) => {
  const source = input && typeof input === 'object' ? input : {}
  const hasStoredMatrix =
    Object.keys(source.central ?? {}).length > 0 ||
    AREA_IDS.some((area) => Object.keys(source[area] ?? {}).length > 0)

  // `{}` is the old pre-migration value. Treat it as the agreed initial full-access
  // matrix, while an explicit matrix (including unchecked boxes) remains authoritative.
  const normalized = hasStoredMatrix ? emptyPermissions() : fullPermissions()

  normalized.central = {
    ...normalized.central,
    manage_users: toBoolean(source.central?.manage_users ?? normalized.central.manage_users),
    view_history: toBoolean(source.central?.view_history ?? normalized.central.view_history),
  }

  AREA_IDS.forEach((area) => {
    const sourceArea = source[area] && typeof source[area] === 'object' ? source[area] : {}
    const nextArea = { ...normalized[area] }

    AREA_ACTIONS.forEach((action) => {
      if (hasOwnPermission(sourceArea, action)) {
        nextArea[action] = toBoolean(sourceArea[action])
      }
    })

    if (hasOwnPermission(sourceArea, 'view') && !toBoolean(sourceArea.view)) {
      AREA_ACTIONS.forEach((action) => {
        nextArea[action] = false
      })
    } else {
      if (hasOwnPermission(sourceArea, 'edit') && !toBoolean(sourceArea.edit)) {
        nextArea.delete = false
        nextArea.edit_sensitive = false
      }
      if (hasOwnPermission(sourceArea, 'view_sensitive') && !toBoolean(sourceArea.view_sensitive)) {
        nextArea.edit_sensitive = false
        if (area === 'utentes') nextArea.export = false
      }

      if (nextArea.edit) nextArea.view = true
      if (nextArea.export) {
        nextArea.view = true
        if (area === 'utentes') nextArea.view_sensitive = true
      }
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
    }

    if (area !== 'utentes') {
      nextArea.view_sensitive = false
      nextArea.edit_sensitive = false
    }
    if (area === 'atividades') {
      nextArea.delete = false
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

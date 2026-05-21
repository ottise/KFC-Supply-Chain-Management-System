# Privilege List (RBAC) - System OJT

This document defines the Privilege Catalog used for RBAC in the project. It maps privileges to modules, roles, and source references.

## Scope
- Roles defined in the system: Admin, Manager, Staff (based on Authentication.Domain.Common.Constants.RegisterRole)
- Privileges are enforced (where implemented) via Authorization policies and HasPermissionRequirement.

## Privilege Catalog (FR Mapping left blank)
| Feature | Detailed Description | Actor | Privileges (CRUD) | FR Mapping |
|---|---|---|---|---|
| Read Roles | View list and details of roles | Admin | PRIV-IDENT-READ-ROLES |  |
| Create Role | Create a new role | Admin | PRIV-IDENT-CREATE-ROLE |  |
| Update Role | Update an existing role | Admin | PRIV-IDENT-UPDATE-ROLE |  |
| Delete Role | Delete a role | Admin | PRIV-IDENT-DELETE-ROLE |  |
| Read Users | View user list | Admin, Manager, Staff | PRIV-USER-READ |  |
| Create User | Create a new user | Admin | PRIV-USER-CREATE |  |
| Update User | Update user information | Admin | PRIV-USER-UPDATE |  |
| Soft Delete User | Soft delete user | Admin | PRIV-USER-DELETE |  |
| Reactivate User | Reactivate deactivated user | Admin | PRIV-USER-REACTIVATE |  |
| Assign Manager | Assign a manager to staff | Admin, Manager | PRIV-USER-ASSIGN-MANAGER |  |
| Unassign Manager | Unassign manager from staff | Admin, Manager | PRIV-USER-UNASSIGN-MANAGER |  |
| Read Warehouses | View list of warehouses | Admin, Manager, Staff | PRIV-WH-READ |  |
| Create Warehouse | Create a new warehouse | Admin | PRIV-WH-CREATE |  |
| Update Warehouse | Update warehouse details | Admin | PRIV-WH-UPDATE |  |
| Activate/Deactivate Warehouse | Change active status | Admin | PRIV-WH-TOGGLE-ACTIVE |  |
| Delete Warehouse | Delete a warehouse | Admin | PRIV-WH-DELETE |  |
| Read Locations | View locations | Admin, Manager, Staff | PRIV-Locations-READ |  |
| Create Location | Create a location | Admin | PRIV-Locations-CREATE |  |
| Update Location | Update a location | Admin | PRIV-Locations-UPDATE |  |
| Activate Location | Activate a location | Admin | PRIV-Locations-ACTIVATE |  |
| Deactivate Location | Deactivate a location | Admin | PRIV-Locations-DEACTIVATE |  |
| Delete Location | Delete a location | Admin | PRIV-Locations-DELETE |  |
| Read Stock Documents | Read stock documents (manager scope) | Manager | PRIV-STOCKDOC-READ |  |
| Read Stock Document Detail | Read stock document detail | Manager | PRIV-STOCKDOC-READ-DETAIL |  |
| Read Stock Documents By Type | Read stock documents by type | Manager | PRIV-STOCKDOC-READ-BY-TYPE |  |
| Read Warehouse Inventory Dashboard | Read warehouse inventory dashboard | Admin | PRIV-WIDGET-DASHBOARD-ADMIN |  |
| Read Employees under Manager | Read employees under manager | Admin, Manager | PRIV-DASHBOARD-MANAGER-EMPLOYEES |  |
| Assign Manager | Assign a manager to staff | Admin, Manager | PRIV-MANAGER-EMPLOYEE-ASSIGN |  |

## Notes
- The actual enforcement depends on the runtime authorization handler (PermissionAuthorizationHandler). Some handlers are not fully implemented in this repo; the catalog reflects the intended design from code comments and Swagger notes.
- You may extend this catalog with a full Traceability Matrix to map each privilege to specific Use Cases.

## Next steps
- Integrate with a proper HasPermission-based authorization handler and claims setup.
- Add a Traceability Matrix to map PrivilegeCodes to Use Case IDs.
- Regenerate tests and security review.

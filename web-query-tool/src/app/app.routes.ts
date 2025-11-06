import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/sql-editor',
    pathMatch: 'full'
  },
  {
    path: 'sql-editor',
    loadComponent: () =>
      import('./features/sql-editor/components/sql-editor-page.component').then(
        m => m.SqlEditorPageComponent
      )
  },
  {
    path: 'connections',
    loadComponent: () =>
      import('./features/connection-manager/components/connection-manager.component').then(
        m => m.ConnectionManagerComponent
      )
  },
  {
    path: '**',
    redirectTo: '/sql-editor'
  }
];

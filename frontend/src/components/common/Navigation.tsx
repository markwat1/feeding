import { NavLink } from 'react-router-dom';
import './Navigation.css';

export const Navigation = () => {
  return (
    <nav className="navigation">
      <ul className="nav-list">
        <li>
          <NavLink to="/" className="nav-link">
            ダッシュボード
          </NavLink>
        </li>
        <li>
          <NavLink to="/pets" className="nav-link">
            ペット管理
          </NavLink>
        </li>
        <li>
          <NavLink to="/feeding" className="nav-link">
            餌やり管理
          </NavLink>
        </li>
        <li>
          <NavLink to="/maintenance" className="nav-link">
            メンテナンス
          </NavLink>
        </li>
        <li>
          <NavLink to="/calendar" className="nav-link">
            カレンダー
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
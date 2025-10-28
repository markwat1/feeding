import './Header.css';

export const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Pet Feeding Tracker</h1>
        <div className="header-info">
          <span className="current-date">
            {new Date().toLocaleDateString('ja-JP')}
          </span>
        </div>
      </div>
    </header>
  );
};
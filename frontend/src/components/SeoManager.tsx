import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applySeo } from '../seo';

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    applySeo(location.pathname);
  }, [location.pathname]);

  return null;
}

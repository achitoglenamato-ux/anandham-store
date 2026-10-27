import { Brand, STORE_NAME } from './Brand';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Brand compact />
      <p>
        © {new Date().getFullYear()} {STORE_NAME}. Fresh groceries to your door. Pay by Cash or UPI on delivery.
      </p>
    </footer>
  );
}

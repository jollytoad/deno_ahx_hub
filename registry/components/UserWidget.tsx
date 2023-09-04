export function UserWidget() {
  return (
    <div
      class="user-widget"
      hx-get="/-/auth/widget"
      hx-trigger="load"
      hx-swap="outerHTML"
    >
    </div>
  );
}

import type { ReactNode } from "react";

import { AccountQueryProvider } from "../../lib/account-query";

export function withAccountProvider(children: ReactNode) {
  return <AccountQueryProvider>{children}</AccountQueryProvider>;
}

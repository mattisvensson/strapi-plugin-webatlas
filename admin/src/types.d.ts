export type NavItem = {
  createdAt: string;
  createdBy: {
    id: number;
    firstname: string;
    lastname: string;
    username: string | null;
  };
  id: number;
  items: {
    count: number;
  };
  name: string;
  slug: string;
  updatedAt: string;
  updatedBy: {
    id: number;
    firstname: string;
    lastname: string;
    username: string | null;
  };
  url_route: string | null;
  visible: boolean;
};

export type MainModal = {
  title: string;
  body: React.ReactNode;
  startAction: React.ReactNode;
  endAction: React.ReactNode;
};
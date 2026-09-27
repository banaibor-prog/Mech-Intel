export type AuthStackParamList = {
  Welcome: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };
  Discover: undefined;
  ProviderDetail: { uid: string };
  PublicProfile: { uid: string };
};

export type ExploreStackParamList = {
  Explore: undefined;
  ProviderDetail: { uid: string };
  PostDetail: { postId: string };
  PublicProfile: { uid: string };
};

export type NetworkStackParamList = {
  Network: undefined;
  ProviderDetail: { uid: string };
  PublicProfile: { uid: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Moderation: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  NetworkTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

import type { NavigatorScreenParams } from '@react-navigation/native';

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
  Profile: undefined;
  AdminHome: undefined;
  AdminUsers: { filter?: 'all' | 'providers' | 'admins' | 'suspended' } | undefined;
  AdminUser: { uid: string };
  AdminJobs: undefined;
  AdminBookings: undefined;
  AdminReports: undefined;
  AdminReviews: undefined;
  AdminSettings: undefined;
  AdminActivity: undefined;
};

export type ExploreStackParamList = {
  /** focusId: a map item id (`job:<postId>` or `pro:<uid>`) to select and fly to on arrival. */
  Explore: { focusId?: string } | undefined;
  ProviderDetail: { uid: string };
  PostDetail: { postId: string };
  PublicProfile: { uid: string };
};

export type NetworkStackParamList = {
  Network: undefined;
  ProviderDetail: { uid: string };
  PublicProfile: { uid: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: NavigatorScreenParams<ExploreStackParamList> | undefined;
  NetworkTab: undefined;
  BookingsTab: undefined;
};

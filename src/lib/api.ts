import axios from 'axios';
import { AUTHORIZATION_SERVICE_URL } from './constant/environment';

export const authorizationApi = axios.create({
  baseURL: AUTHORIZATION_SERVICE_URL,
  headers: {},
});

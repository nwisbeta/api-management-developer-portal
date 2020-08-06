import "./polyfills";
import "./bindingHandlers/scrollintoview";
import "./bindingHandlers/copyToClipboard";
import "./bindingHandlers/syntaxHighlight";
import "./bindingHandlers/markdown";
import "./bindingHandlers/barChart";
import "./bindingHandlers/mapChart";
import "./bindingHandlers/minMaxAvgChart";
import "./bindingHandlers/acceptChange";
import "./themes/website/scripts";
import "@paperbits/core/ko/bindingHandlers/bindingHandlers.component";
import "@paperbits/core/ko/bindingHandlers/bindingHandlers.focus";
import "@paperbits/core/ko/bindingHandlers/bindingHandlers.activate";
import "@paperbits/core/ko/bindingHandlers/bindingHandlers.scrollable";
import { RouteHelper } from "./routing/routeHelper";
import { IInjector, IInjectorModule } from "@paperbits/common/injection";
import { DefaultEventManager } from "@paperbits/common/events";
import { XmlHttpRequestClient } from "@paperbits/common/http";
import { SettingsProvider } from "@paperbits/common/configuration";
import { DefaultRouter } from "@paperbits/common/routing";
import { ConsoleLogger } from "@paperbits/common/logging";
import { KnockoutRegistrationLoaders } from "@paperbits/core/ko/knockout.loaders";
import { ApiList, ApiListDropdown, ApiListTiles } from "./components/apis/list-of-apis/ko/runtime";
import { ApiService } from "./services/apiService";
import { TagService } from "./services/tagService";
import { TenantService } from "./services/tenantService";
import { AnalyticsService } from "./services/analyticsService";
import { ApiDetails } from "./components/apis/details-of-api/ko/runtime/api-details";
import { ApiHistory } from "./components/apis/history-of-api/ko/runtime/api-history";
import { OperationDetails } from "./components/operations/operation-details/ko/runtime/operation-details";
import { OperationConsole } from "./components/operations/operation-details/ko/runtime/operation-console";
import { ProductService } from "./services/productService";
import { FileInput } from "./components/file-input/file-input";
import { MapiClient } from "./services/mapiClient";
import { UsersService } from "./services/usersService";
import { Signin } from "./components/users/signin/ko/runtime/signin";
import { Signin as SigninCymru } from "./components/users/signin-cymru/ko/runtime/signin";
import { SignInAad } from "./components/users/signin-social/ko/runtime/signin-aad";
import { SignInAadB2C } from "./components/users/signin-social/ko/runtime/signin-aad-b2c";
import { Signup } from "./components/users/signup/ko/runtime/signup";
import { Signup as SignupCymru } from "./components/users/signup-cymru/ko/runtime/signup";
import { SignupSocial } from "./components/users/signup-social/ko/runtime/signup-social";
import { Profile } from "./components/users/profile/ko/runtime/profile";
import { Subscriptions } from "./components/users/subscriptions/ko/runtime/subscriptions";
import { ProductList } from "./components/products/product-list/ko/runtime/product-list";
import { SandboxDetails } from "./components/products/product-details/ko/runtime/sandbox-details";
import { SandboxSubscribe } from "./components/products/product-subscribe/ko/runtime/sandbox-subscribe";
import { DefaultAuthenticator } from "./components/defaultAuthenticator";
import { Spinner } from "./components/spinner/spinner";
import { SandboxApis } from "./components/products/product-apis/ko/runtime/sandbox-apis";
import { OperationList } from "./components/operations/operation-list/ko/runtime/operation-list";
import { SandboxSubscriptions } from "./components/products/product-subscriptions/ko/runtime/sandbox-subscriptions";
import { AadService } from "./services/aadService";
import { BackendService } from "./services/backendService";
import { HipCaptcha } from "./components/users/runtime/hip-captcha/hip-captcha";
import { ResetPassword } from "./components/users/reset-password/ko/runtime/reset-password";
import { ConfirmPassword } from "./components/users/confirm-password/ko/runtime/confirm-password";
import { ChangePassword } from "./components/users/change-password/ko/runtime/change-password";
import { Reports } from "./components/reports/ko/runtime/reports";
import { UnhandledErrorHandler } from "./errors/unhandledErrorHandler";
import { ProductListDropdown } from "./components/products/product-list/ko/runtime/product-list-dropdown";
import { ValidationSummary } from "./components/users/validation-summary/ko/runtime/validation-summary";
import { TypeDefinitionViewModel } from "./components/operations/operation-details/ko/runtime/type-definition";
import { CodeSampleViewModel } from "./components/operations/operation-details/ko/runtime/code-sample";
import { VisibilityGuard } from "@paperbits/common/user";
import { StaticUserService } from "./services";
import { SignOutRouteGuard } from "./routing/signOutRouteGuard";
import { ProvisionService } from "./services/provisioningService";
import { BalloonBindingHandler, ResizableBindingHandler } from "@paperbits/core/ko/bindingHandlers";
import { TagInput } from "./components/tag-input/tag-input";
import { ViewStack } from "@paperbits/core/ko/ui/viewStack";
import { OAuthService } from "./services/oauthService";
import { DefaultSessionManager } from "./authentication/sessionManager";

export class ApimRuntimeModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bindModule(new KnockoutRegistrationLoaders());
        injector.bindSingleton("eventManager", DefaultEventManager);
        injector.bindSingleton("logger", ConsoleLogger);
        injector.bindCollection("autostart");
        injector.bindToCollection("autostart", UnhandledErrorHandler);
        injector.bindToCollection("autostart", BalloonBindingHandler);
        injector.bindToCollection("autostart", ResizableBindingHandler);
        injector.bindCollection("routeGuards");
        injector.bindToCollection("routeGuards", SignOutRouteGuard);
        injector.bindToCollection("autostart", VisibilityGuard);
        injector.bindSingleton("router", DefaultRouter);
        injector.bind("apiList", ApiList);
        injector.bind("apiListDropdown", ApiListDropdown);
        injector.bind("apiListTiles", ApiListTiles);
        injector.bind("apiDetails", ApiDetails);
        injector.bind("apiHistory", ApiHistory);
        injector.bind("operationDetails", OperationDetails);
        injector.bind("operationConsole", OperationConsole);
        injector.bind("typeDefinition", TypeDefinitionViewModel);
        injector.bind("codeSample", CodeSampleViewModel);
        injector.bind("fileInput", FileInput);
        injector.bind("apiService", ApiService);
        injector.bind("tagService", TagService);
        injector.bind("productService", ProductService);
        injector.bind("analyticsService", AnalyticsService);
        injector.bind("signin", Signin);
        injector.bind("signinCymru", SigninCymru)
        injector.bind("signInAad", SignInAad);
        injector.bind("signInAadB2C", SignInAadB2C);
        injector.bind("signup", Signup);
        injector.bind("signupCymru", SignupCymru);
        injector.bind("signupSocial", SignupSocial);
        injector.bind("profile", Profile);
        injector.bind("subscriptions", Subscriptions);
        injector.bind("productList", ProductList);
        injector.bind("productListDropdown", ProductListDropdown);
        injector.bind("validationSummary", ValidationSummary);
        injector.bind("productDetails", SandboxDetails);
        injector.bind("productSubscribe", SandboxSubscribe);
        injector.bind("productSubscriptions", SandboxSubscriptions);
        injector.bind("productApis", SandboxApis);
        injector.bind("operationList", OperationList);
        injector.bind("operationDetails", OperationDetails);
        injector.bind("usersService", UsersService);
        injector.bind("reports", Reports);
        injector.bind("hipCaptcha", HipCaptcha);
        injector.bind("resetPassword", ResetPassword);
        injector.bind("confirmPassword", ConfirmPassword);
        injector.bind("changePassword", ChangePassword);
        injector.bind("spinner", Spinner);
        injector.bindSingleton("tenantService", TenantService);
        injector.bindSingleton("backendService", BackendService);
        injector.bindSingleton("aadService", AadService);
        injector.bindSingleton("mapiClient", MapiClient);
        injector.bindSingleton("httpClient", XmlHttpRequestClient);
        injector.bindSingleton("settingsProvider", SettingsProvider);
        injector.bindSingleton("authenticator", DefaultAuthenticator);
        injector.bindSingleton("routeHelper", RouteHelper);
        injector.bindSingleton("userService", StaticUserService);
        injector.bindSingleton("provisioningService", ProvisionService);
        injector.bindSingleton("oauthService", OAuthService);
        injector.bindSingleton("viewStack", ViewStack);
        injector.bindSingleton("sessionManager", DefaultSessionManager);
        injector.bind("tagInput", TagInput);
    }
}
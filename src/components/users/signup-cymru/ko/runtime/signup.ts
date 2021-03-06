import * as ko from "knockout";
import * as validation from "knockout.validation";
import template from "./signup.html";
import { Component, RuntimeComponent, OnMounted, Param } from "@paperbits/common/ko/decorators";
import { EventManager } from "@paperbits/common/events";
import { BackendService } from "../../../../../services/backendService";
import { UsersService } from "../../../../../services/usersService";
import { SignupRequest } from "../../../../../contracts/signupRequest";
import { ValidationReport } from "../../../../../contracts/validationReport";

declare var WLSPHIP0;

@RuntimeComponent({
    selector: "signup-cymru-runtime"
})
@Component({
    selector: "signup-cymru-runtime",
    template: template
})
export class Signup {
    public readonly email: ko.Observable<string>;
    public readonly password: ko.Observable<string>;
    public readonly passwordConfirmation: ko.Observable<string>;
    public readonly firstName: ko.Observable<string>;
    public readonly lastName: ko.Observable<string>;
    public readonly isUserRequested: ko.Observable<boolean>;
    public readonly showTerms: ko.Observable<boolean>;
    public readonly consented: ko.Observable<boolean>;
    public readonly showHideLabel: ko.Observable<string>;
    public readonly working: ko.Observable<boolean>;
    public readonly captcha: ko.Observable<string>;

    constructor(
        private readonly usersService: UsersService,
        private readonly eventManager: EventManager,
        private readonly backendService: BackendService) {
        this.email = ko.observable("");
        this.password = ko.observable("");
        this.passwordConfirmation = ko.observable("");
        this.firstName = ko.observable("");
        this.lastName = ko.observable("");
        this.isUserRequested = ko.observable(false);
        this.isConsentRequired = ko.observable(false);
        this.consented = ko.observable(false);
        this.showTerms = ko.observable();
        this.termsOfUse = ko.observable();
        this.showHideLabel = ko.observable("Dangoswch");
        this.working = ko.observable(false);
        this.captcha = ko.observable();
        this.delegationUrl = ko.observable();
        this.termsEnabled = ko.observable(false);
        this.requireHipCaptcha = ko.observable();

        validation.init({
            insertMessages: false,
            errorElementClass: "is-invalid",
            decorateInputElement: true
        });

        this.email.extend(<any>{ required: { message: `Angen e-bost.` }, email: true });
        this.password.extend(<any>{ required: { message: `Angen cyfrinair.` }, minLength: 8 }); // TODO: password requirements should come from Management API.
        this.passwordConfirmation.extend(<any>{ required: { message: `Angen cadarnhau cyfrinair.` }, equal: { message: "Rhaid i’r maes cadarnhau cyfrinair fod yr un peth â’r cyfrinair", params: this.password } });
        this.firstName.extend(<any>{ required: { message: `Angen enw cyntaf.` } });
        this.lastName.extend(<any>{ required: { message: `Angen cyfenw.` } });
        this.captcha.extend(<any>{ required: { message: `Angen Captcha.` } });
    }


    @Param()
    public requireHipCaptcha: ko.Observable<boolean>;

    @Param()
    public termsOfUse: ko.Observable<string>;

    @Param()
    public isConsentRequired: ko.Observable<boolean>;

    @Param()
    public termsEnabled: ko.Observable<boolean>;

    @Param()
    public delegationUrl: ko.Observable<string>;

    /**
     * Initializes component right after creation.
     */
    @OnMounted()
    public async initialize(): Promise<void> {
        try {
            const isUserSignedIn = await this.usersService.isUserSignedIn();

            if (isUserSignedIn) {
                this.usersService.navigateToHome();
                return;
            }
            else {
                const queryParams = new URLSearchParams(location.search);

                if (queryParams.has("userid") && queryParams.has("ticketid") && queryParams.has("ticket")) {
                    await this.usersService.activateUser(queryParams);

                    const userId = await this.usersService.getCurrentUserId();

                    if (!userId) {
                        console.error("Gwall wrth gynnau'r defnyddiwr: Ni ddaethpwyd o hyd i'r defnyddiwr.");
                    } else {
                        this.usersService.navigateToHome();
                    }
                }
            }
        }
        catch (error) {
            if (error.code === "Unauthorized" || error.code === "ResourceNotFound") {
                return;
            }

            throw error;
        }

        if (this.termsOfUse() && this.termsEnabled()) {
            if (this.isConsentRequired()) {
                this.consented.extend(<any>{ equal: { params: true, message: "Rhaid i chi gytuno i'r telerau cofrestru." } });
            }
        }
    }

    /**
     * Sends user signup request to Management API.
     */
    public async signup(): Promise<void> {
        const isCaptchaRequired = this.requireHipCaptcha();

        const validationGroup = {
            email: this.email,
            password: this.password,
            passwordConfirmation: this.passwordConfirmation,
            firstName: this.firstName,
            lastName: this.lastName
        };

        let captchaSolution;
        let captchaFlowId;
        let captchaToken;
        let captchaType;

        if (isCaptchaRequired) {
            validationGroup["captcha"] = this.captcha;

            WLSPHIP0.verify((solution, token, param) => {
                WLSPHIP0.clientValidation();

                if (WLSPHIP0.error !== 0) {
                    this.captcha(null); // is not valid
                    return;
                }
                else {
                    captchaSolution = solution;
                    captchaToken = token;
                    captchaType = WLSPHIP0.type;
                    const flowIdElement = <HTMLInputElement>document.getElementById("FlowId")
                    captchaFlowId = flowIdElement.value;
                    this.captcha("valid");
                    return;
                }
            }, "");
        }

        const result = validation.group(validationGroup);

        let clientErrors = result();

        if (this.termsEnabled() && this.isConsentRequired()) {
            const termsConsented = validation.group({
                consented: this.consented
            });

            clientErrors = clientErrors.concat(termsConsented());
        }

        if (clientErrors.length > 0) {
            result.showAllMessages();
            const validationReport: ValidationReport = {
                source: "signup",
                errors: clientErrors
            };
            this.eventManager.dispatchEvent("onValidationErrors", validationReport);
            return;
        }

        const mapiSignupData = {
            email: this.email(),
            firstName: this.firstName(),
            lastName: this.lastName(),
            password: this.password(),
            confirmation: "signup",
            appType: "developerPortal"
        };

        try {
            this.working(true);

            if (isCaptchaRequired) {
                const createSignupRequest: SignupRequest = {
                    solution: captchaSolution,
                    flowId: captchaFlowId,
                    token: captchaToken,
                    type: captchaType,
                    signupData: mapiSignupData
                };

                await this.backendService.sendSignupRequest(createSignupRequest);
            }
            else {
                await this.usersService.createSignupRequest(mapiSignupData);
            }

            this.isUserRequested(true);

            const validationReport: ValidationReport = {
                source: "signup",
                errors: []
            };
            this.eventManager.dispatchEvent("onValidationErrors", validationReport);
        }
        catch (error) {
            if (isCaptchaRequired) {
                WLSPHIP0.reloadHIP();
            }

            let errorMessages: string[];

            if (error.code === "ValidationError") {
                const details: any[] = error.details;

                if (details && details.length > 0) {
                    errorMessages = details.map(item => `${item.message}`);
                }
            }
            else {
                errorMessages = ["Gwall ar y gweinydd. Nid oedd modd anfon y cais. Rhowch gynnig arni yn nes ymlaen."];
            }

            const validationReport: ValidationReport = {
                source: "signup",
                errors: errorMessages
            };

            this.eventManager.dispatchEvent("onValidationErrors", validationReport);
        }
        finally {
            this.working(false);
        }
    }


    /**
     * Shows/hides registration terms.
     */
    public toggleRegistrationTerms(): void {
        if (this.showTerms()) {
            this.showHideLabel("Dangoswch");
        }
        else {
            this.showHideLabel("Cuddiwch");
        }

        this.showTerms(!this.showTerms());
    }
}
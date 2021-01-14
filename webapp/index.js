const CURRENCIES_VALUES_PRESET_ARRAY = [40, 100, 200, 1000, 2500, 5000];
const PRESELECTED_VALUE = 40;
const CURRENCIES_DETAILS_ARRAY= [
	{name: "US Dollar", code: "USD", symbol: "$", rate: 1},
	{name: "Euro", code: "EUR", symbol: "€", rate: 0.897597},
	{name: "British Pound", code: "GBP", symbol: "£", rate: 0.81755},
	{name: "Russian Ruble", code: "RUB", symbol: "₽", rate: 63.461993}
];

var buttonComponent = Vue.component('lightable-button', {
	props: ['clickedvalue', 'id'],
	data: function () {
        return {
            updatableClickedvalue: this.clickedvalue
        }
    },
	template: '<button @click="updatePushed()" class="regularButton">{{ updatableClickedvalue }}</button>',
	methods:{
		updatePushed: function () {
			store.setPushed(this.updatableClickedvalue);
			store.setInputed(this.updatableClickedvalue, this.$parent.locale);
			this.$parent.testInputValue(this.updatableClickedvalue);
		},
		formatCurrencies: function (value) {
			this.$parent.formatCurrencies(value);
		}
	}
});

var store = {
	state: {
		pushed: null,
		selected: null,
		inputed: null
	},
	setPushed(incomingValue) {
	  this.state.pushed = incomingValue;
	},
	getPushed() {
	  return this.state.pushed;
	},
	setSelected(incomingValue) {
		this.state.selected = incomingValue;
	},
	getSelected() {
		return this.state.selected;
	},
	setInputed(incomingValue) {
		this.state.inputed = incomingValue;
	},
	getInputed() {
		return this.state.inputed;
	}
};

var app = new Vue({
	el: '#app',
	data: {
		selected: '',
		sended: false,
		store: store,
		presets: CURRENCIES_VALUES_PRESET_ARRAY,
		suggestion: PRESELECTED_VALUE,
		currencies: CURRENCIES_DETAILS_ARRAY,
		defualtCurrency: CURRENCIES_DETAILS_ARRAY[0].code,
		locale: null
	},
	methods: {
		testInputValue: function (inputtedValue) {
			var findedButton;
			for (const buttonToInspect in this.$refs)
				if (parseInt(this.$refs[buttonToInspect][0].$el.innerHTML.replace(/\s|&nbsp;/g, '')) == inputtedValue)
					findedButton = this.$refs[buttonToInspect][0];
			if (findedButton)
				for (const lightableButton in this.$refs)
					if (parseInt(this.$refs[lightableButton][0].$el.innerHTML.replace(/\s|&nbsp;/g, '')) == inputtedValue)
						this.$refs[lightableButton][0].$el.className="selectedButton";
					else
						this.$refs[lightableButton][0].$el.className="regularButton";
			else
				for (const lightableButton in this.$refs)
					this.$refs[lightableButton][0].$el.className="regularButton";
		},
		buildButtonRefString: function (valueString) {
			return `b_${valueString}`;
		},
		makeConversion: function (selectedCurrencyCode) {
			if (selectedCurrencyCode == this.defualtCurrency)
				this.makeDefaultSettings();
			else{
				this.store.setSelected(selectedCurrencyCode);
				const convertionRate = this.findCurrencyRate(selectedCurrencyCode);
				const convertedValue = this.roughtRoundValue(this.roundValue(this.store.getInputed()*convertionRate));
				for (const lightableButton in this.$refs){
					const newValue = this.roughtRoundValue(this.roundValue(this.$refs[lightableButton][0].updatableClickedvalue*convertionRate));
					this.$refs[lightableButton][0].updatableClickedvalue = newValue;
					this.$refs[lightableButton][0].$el.innerHTML = this.formatCurrencies(newValue);
				}
				this.testInputValue(convertedValue);
				this.store.setInputed(convertedValue);
			}
		},
		findCurrencyRate: function(currencyCode){
			return this.currencies.find(currencyDetails => currencyDetails.code == currencyCode).rate;
		},
		checkInputedNumbers ($event) {
			let keyCode = ($event.keyCode ? $event.keyCode : $event.which);
			if ((keyCode < 48 || keyCode > 57) && keyCode == 46)
			   $event.preventDefault();
		},
		roughtRoundValue(incomingValue) {
			const decDivisionResult = incomingValue/10;
			var roundedNumber = parseInt(decDivisionResult)*10;
			const smalerPart = incomingValue - roundedNumber*10;
			if (smalerPart < 10 && smalerPart != 0)
				roundedNumber = parseInt(decDivisionResult + 1)*10;
			return roundedNumber;
		},
		roundValue(incomingValue) {
			return Number(Number(incomingValue).toFixed(0));
		},
		formatCurrencies (input) {
			const formatted = new Intl.NumberFormat(this.locale, { style: 'currency', currency: this.store.getSelected() }).format(input);
			return formatted;
		},
		makeDefaultSettings () {
			const defaultValue = this.suggestion;
			this.store.setPushed(defaultValue);
			this.store.setInputed(defaultValue);
	
			const defaultCurrency = this.defualtCurrency;
			this.selected = defaultCurrency;
			this.store.setSelected(defaultCurrency);
			for (const lightableButton in this.$refs){
				const restoredValue = Number(lightableButton.substring(2));
				const restoredFormattedValue = this.formatCurrencies(lightableButton.substring(2));
				if (this.$refs[lightableButton][0].updatableClickedvalue != restoredValue)
					this.$refs[lightableButton][0].updatableClickedvalue = restoredValue;
				this.$refs[lightableButton][0].$el.innerHTML = restoredFormattedValue;
			}
			this.testInputValue(defaultValue);
		},
		async makeRequest () {
			const requestOptions = {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					amount: this.store.getInputed(),
					currency: this.store.getSelected()
				})
			};
			fetch('http://localhost:4001/donate', requestOptions)
				.then(async response => {
					var data = await response;
					data = await data.json();
					if (data && data.ok)
						alert('Thank you for your donation!');
					if (!response.ok) {
						const error = (data && data.message) || response.status;
						return Promise.reject(error);
					}
				})
				.catch(error => {
					this.errorMessage = error;
					console.error('There was an error!', error);
				});
		}
	},
	mounted: function () {
		this.locale = navigator.language || navigator.browserLanguage || navigator.systemLanguage || 'ru-RU';
		this.makeDefaultSettings();
	},
	components: {
		buttonComponent: buttonComponent
	},
});

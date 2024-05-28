<script lang="tsx">
import dayjs from 'dayjs';

export default {
  setup() {
    const list = ref([1, 2, 3]);
    const { locale, setLocale } = useI18n();

    const now = dayjs();
    const isSame = now.isSame('2024-05-22');
    const now2 = dayjs().startOf('day');
    const isSame2 = now2.isSame('2024-05-22');
    const a = ref(dayjs());

    const isShow = ref(false);
    const showUp = ref('great');
    const inputText = ref('');
    const placeHolder = ref('');
    const inputDisable = ref(false);
    const abc = ref(2);
    const ccc = ref(2);

    const changeShow = () => {
      isShow.value = !isShow.value;
    };

    const changePlaceHolder = () => {
      placeHolder.value = inputText.value;
    };

    const changeInputDisable = () => {
      inputDisable.value = !inputDisable.value;
    };

    return {
      list,
      a,
      now,
      now2,
      isSame,
      isSame2,
      locale,
      isShow,
      showUp,
      inputText,
      placeHolder,
      inputDisable,

      setLocale,
      changeShow,
      changePlaceHolder,
      changeInputDisable,
    };
  },
  render() {
    return (
      <>
        <div>
          <el-button onClick={() => this.setLocale('en')}>EN</el-button>
          <el-button onClick={() => this.setLocale('zh')}>ZH</el-button>
          {this.list.map((item) => {
            return <div>{item}</div>;
          })}
          {/* <p>{this.a}</p> */}
          <p>{`${this.now.format('YYYY-MM-DD ')}`}</p>
          <p>{`${this.isSame}`}</p>
          <p>{`${this.isSame2}`}</p>
          {/* <p>{`${dayjs() === dayjs().isSame("2024-05-22")}`}</p> */}
          {/* <p>{`${dayjs().startOf('day')}`}</p> */}
          <p>{`${this.now2.format('YYYY-MM-DD HH:mm:ss')}`}</p>
          <p>{this.$t('ttes')}</p>
          <p>{this.$t('ttes')}</p>
          <p>{this.locale}</p>
          <div v-show={this.isShow}>{this.showUp}</div>
          <div v-show={!this.isShow}>{`not ${this.showUp}`}</div>
          <span>{'-------'}</span>
          <div v-if={this.isShow}>{this.showUp}</div>
          <div v-else>{`not ${this.showUp}`}</div>
          {/* <input :disable="!this.isShow" type="text" /> */}
          <el-input
            placeholder={this.placeHolder}
            v-model={this.inputText}
            disabled={this.inputDisable}
            style="width: 200px"
          />
          <input class="border" type="text" disabled={this.inputDisable} />
          <img src="" alt="" />
          <p>{`你輸入了${this.inputText}`}</p>
          <p>{123}</p>
          <div>{this.isShow ? <p>'正在顯示'</p> : <p>'完了沒顯示'</p>}</div>
          <div class="flex flex-col w-[200px]">
            <el-button class="mb-2 " onClick={() => this.changeShow()}>
              變一下顯示
            </el-button>
            <el-button onClick={() => this.changePlaceHolder()}>
              改變input to placeHolder
            </el-button>
            <el-button onClick={() => this.changeInputDisable()}>
              輸入禁用
            </el-button>
          </div>
          <div>{`is ${this.isShow}`}</div>
        </div>
      </>
    );
  },
};
</script>
